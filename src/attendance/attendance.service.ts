import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from 'src/entities/attendance.entity';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { SaturdayTT } from 'src/enums/saturday.tt';
import { ObjectId } from 'mongodb';
import { WeekService } from 'src/week/week.service';
import { UpdateAttendanceDto } from './dto/updateAttendance.dto';
import { Subject } from 'src/entities/subject.entity';
import { GetAttendancePercentageOutput } from './dto/attendancePercentage.dto';

const CURRENT_SEM = '68dccf5c38107cbf5d0ecaf9';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @Inject(forwardRef(() => WeekService))
    private weekService: WeekService,
  ) {}

  // Subject Mapping
  subjects = [
    { subjectCode: 'MA23C05', id: '68dcd0db38107cbf5d0ecafd' },
    { subjectCode: 'CS23301', id: '68df5aa738107cbf5d0ecb29' },
    { subjectCode: 'CS23302', id: '68df5aca38107cbf5d0ecb2a' },
    { subjectCode: 'CS23304', id: '68df5ae538107cbf5d0ecb2b' },
    { subjectCode: 'CS23U01', id: '68df5b0e38107cbf5d0ecb2c' },
    { subjectCode: 'CS23303', id: '68df5b4738107cbf5d0ecb2d' },
    { subjectCode: 'U23U01', id: '68df5b6c38107cbf5d0ecb2e' },
    { subjectCode: 'CS23S01', id: '68df5bd638107cbf5d0ecb2f' },
  ];

  isSameDate(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  @Cron('0 0 * * 1-6', { timeZone: 'Asia/Kolkata' })
  async updateAttendanceCron(isManualUpdate: boolean = false) {
    const subjectMap = new Map(
      this.subjects.map((sub) => [sub.subjectCode, sub.id]),
    );
    const week = await this.weekService.getLatestWeek();
    const today = new Date();
    const dayNumber = today.getDay();

    if (dayNumber === 0) return;
    if (dayNumber === 6 && week.saturdayStatus === SaturdayTT.Leave) return;

    const startIndex = (dayNumber - 1) * 8;
    const endIndex = dayNumber * 8;
    const todaySchedule = week.timeTable.slice(startIndex, endIndex);

    const subjectToPeriod: Map<string, number[]> = new Map();
    todaySchedule.forEach((subjectCode, idx) => {
      if (!subjectCode) return;
      if (!subjectToPeriod.has(subjectCode))
        subjectToPeriod.set(subjectCode, []);
      subjectToPeriod.get(subjectCode)!.push(idx + 1);
    });

    for (const [subjectCode, periods] of subjectToPeriod.entries()) {
      const subjectId = subjectMap.get(subjectCode);
      if (!subjectId) continue;

      const attended = new Array(periods.length).fill(false);
      const students = await this.attendanceRepository.find({
        where: {
          semesterId: new ObjectId(CURRENT_SEM),
          subjectId: new ObjectId(subjectId),
        },
      });

      for (const student of students) {
        const attendanceRecord = {
          isUpdated: false,
          date: new Date(),
          attended,
          periods,
          monthNumber: today.getMonth(),
        };

        if (isManualUpdate) {
          const existingIndex = student.attendanceRecords.findIndex(
            (val) =>
              this.isSameDate(val.date, new Date()) &&
              val.periods.some((p) => periods.includes(p)),
          );

          if (existingIndex >= 0) {
            student.attendanceRecords[existingIndex] = attendanceRecord;
          } else {
            student.attendanceRecords.push(attendanceRecord);
          }
        } else {
          student.attendanceRecords.push(attendanceRecord);
          student.totalContactHours += periods.length;
        }

        await this.attendanceRepository.save(student);
      }
    }
  }

  async updateAttendance(input: UpdateAttendanceDto) {
    const subjectMap = new Map<string, string>(
      this.subjects.map((sub) => [sub.subjectCode, sub.id]),
    );
    const subjectId = subjectMap.get(input.subjectCode);
    if (!subjectId) throw new HttpException('Not a valid subject Code', 404);

    const attendanceData = input.attendanceData;

    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        subjectId: new ObjectId(subjectId),
        semesterId: new ObjectId(CURRENT_SEM),
      },
    });

    for (const record of attendanceRecords) {
      const rollNo = record.studentRollNo;

      const record_index = record.attendanceRecords.findIndex((r) =>
        this.isSameDate(input.date, r.date),
      );

      const attendance_index = attendanceData.findIndex(
        (r) => r.rollNo === rollNo,
      );

      //To make sure you can put partial attendance
      if (attendance_index < 0) continue;

      if (record_index >= 0) {
        try {
          const attended = attendanceData[attendance_index].attended;
          record.attendanceRecords[record_index].attended = attended;
          record.attendanceRecords[record_index].isUpdated = true;
          //Counting the no of true's to get the attended hours
          const attendedHours = attended.filter(Boolean).length;
          record.attendedContactHours += attendedHours;
          record.attendancePercentage =
            (record.attendedContactHours / record.totalContactHours) * 100;
          await this.attendanceRepository.save(record);
        } catch (error) {
          throw new HttpException(
            'Unable to save attendance record due to a database error.',
            500,
          );
        }
      } else {
        throw new HttpException(
          "Attendance record with the given date or Attendance record for a student doesn't exist.",
          404,
        );
      }
    }
    return true;
  }

  async getAttendancePercentage(rollNo) {
    const attendanceRecords = await this.attendanceRepository.find({
      where: { studentRollNo: rollNo, semesterId: new ObjectId(CURRENT_SEM) },
    });
    let attendanceRecordsWithSubjectDetails: GetAttendancePercentageOutput[] =
      [];

    for (const record of attendanceRecords) {
      const subjectDetails = await this.subjectRepository.findOneById(
        record.subjectId,
      );

      if (subjectDetails) {
        console.log(subjectDetails);
        const recordWithSubjectDetails = {
          attendance: {
            ...record,
            attendanceRecords: record.attendanceRecords.map((r) => r),
          },
          subjectDetails: subjectDetails,
        };
        attendanceRecordsWithSubjectDetails.push(recordWithSubjectDetails);
      } else {
        throw new HttpException('Subject Not Found.', 404);
      }
    }

    return attendanceRecordsWithSubjectDetails;
  }

  async getSubjectDetails() {
    const subjects = await this.subjectRepository.find({
      where: { semesterId: new ObjectId(CURRENT_SEM) },
    });
    return subjects;
  }
  async getAttendanceRecord(rollNo: number, subjectId: string) {
    const attendanceRecord = await this.attendanceRepository.findOne({
      where: {
        studentRollNo: rollNo,
        subjectId: new ObjectId(subjectId),
        semesterId: new ObjectId(CURRENT_SEM),
      },
    });
    return attendanceRecord;
  }
}
