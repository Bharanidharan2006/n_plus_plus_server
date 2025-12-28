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
import { UpdateDailyAttendanceDto } from './dto/updateDailyAttendance.dto';
import { User } from 'src/entities/user.entity';

const CURRENT_SEM = '68dccf5c38107cbf5d0ecaf9';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    { subjectCode: 'UC23U01', id: '68df5b6c38107cbf5d0ecb2e' },
    { subjectCode: 'CS23S01', id: '68df5bd638107cbf5d0ecb2f' },
  ];

  subjectIdToCodeMap = new Map(
    this.subjects.map((sub) => [sub.id, sub.subjectCode]),
  );

  subjectMap = new Map(this.subjects.map((sub) => [sub.subjectCode, sub.id]));

  isSameDate(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  parseDate(date: any): Date {
    const [dd, mm, yyyy] = date.split('-').map(Number);
    console.log(yyyy, mm - 1, dd);
    return new Date(yyyy, mm - 1, dd);
  }

  // Returns the schedule of a day given a date.
  async getScheduleByDate(date: Date): Promise<string[]> {
    let week;
    if (date == new Date()) {
      week = await this.weekService.getLatestWeek();
    } else {
      const allWeeks = await this.weekService.getAllWeeks();
      for (const t_week of allWeeks) {
        // date > week.startDate -> cause the first day of the week is sunday so don't need to check with an date >= week.startDate
        if (date > t_week.startDate && date <= t_week.endDate) {
          week = t_week;
        }
      }
    }

    const dayNumber = date.getDay();

    if (dayNumber === 0) return [];
    if (dayNumber === 6 && week.saturdayStatus === SaturdayTT.Leave) return [];

    const startIndex = (dayNumber - 1) * 8;
    const endIndex = dayNumber * 8;
    const schedule = week.timeTable.slice(startIndex, endIndex);
    let todayIsNotHoliday = false;
    for (const period of schedule) {
      if (period !== '') {
        todayIsNotHoliday = true;
      }
    }

    return todayIsNotHoliday ? schedule : [];
  }

  @Cron('0 17 * * 1-6', {
    timeZone: 'Asia/Kolkata',
  })
  async updateAttendanceCron(isManualUpdate: boolean = false) {
    const today = new Date();
    const todaySchedule = await this.getScheduleByDate(today);
    console.log('Updated Attendance for all');
    if (todaySchedule.length === 0) return;

    const subjectToPeriod: Map<string, number[]> = new Map();
    todaySchedule.forEach((subjectCode, idx) => {
      if (!subjectCode) return;
      if (!subjectToPeriod.has(subjectCode))
        subjectToPeriod.set(subjectCode, []);
      subjectToPeriod.get(subjectCode)!.push(idx + 1);
    });

    for (const [subjectCode, periods] of subjectToPeriod.entries()) {
      const subjectId = this.subjectMap.get(subjectCode);
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
          date: today,
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

  async getSubjectInfo(id: string) {
    const subject = await this.subjectRepository.find({
      where: {
        semesterId: new ObjectId(CURRENT_SEM),
        subjectCode: this.subjectIdToCodeMap.get(id),
      },
    });
    if (subject) {
      return subject;
    } else {
      throw new HttpException(
        'Subject with the given object id is not found',
        404,
      );
    }
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

  // Given a student's rollno and daily attendance data, this function updates function for each subject.
  async updateDailyAttendance(input: UpdateDailyAttendanceDto) {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(input.date)) {
      throw new HttpException('Invalid date format', 400);
    }

    const schedule = await this.getScheduleByDate(this.parseDate(input.date));
    console.log(schedule);
    if (!schedule || schedule.length == 0) {
      throw new HttpException('No schedule found for the given day.', 404);
    }

    console.log(this.parseDate(input.date));

    // Note: Attendance data is updated period by period. So if you have a block hour like first two hours maths, the 'isUpdated' field will be set to true when the first period's attendance is updated. So if a failure happens after updating the first hour attendance, it may be lead to inaccurate data (atomicity problem)

    for (let i = 0; i < schedule.length; i++) {
      let subjectCode = schedule[i];
      if (subjectCode !== '') {
        const subjectId = this.subjectMap.get(subjectCode);
        const attendanceRecord = await this.attendanceRepository.findOne({
          where: {
            studentRollNo: input.rollNo,
            subjectId: new ObjectId(subjectId),
            semesterId: new ObjectId(CURRENT_SEM),
          },
        });

        if (!attendanceRecord)
          throw new HttpException(
            'No attendance record found for given rollno, subject and semester',
            404,
          );

        const recordIndex = attendanceRecord?.attendanceRecords.findIndex((r) =>
          this.isSameDate(this.parseDate(input.date), r.date),
        );

        if (recordIndex >= 0) {
          try {
            if (
              !attendanceRecord.attendanceRecords[recordIndex].periods.includes(
                i + 1,
              )
            ) {
              throw new HttpException('Period mismatch', 500);
            }
            const periodIndex = attendanceRecord.attendanceRecords[
              recordIndex
            ].periods.findIndex((v) => v === i + 1);
            attendanceRecord.attendanceRecords[recordIndex].attended[
              periodIndex
            ] = input.attendanceData[i];
            // console.log(
            //   attendanceRecord.attendanceRecords[recordIndex].attended[
            //     periodIndex
            //   ],
            //   input.attendanceData[i],
            //   periodIndex,
            // );

            attendanceRecord.attendanceRecords[recordIndex].isUpdated = true;

            await this.attendanceRepository.save(attendanceRecord);
          } catch (error) {
            throw new HttpException(
              'Unable to save attendance record due to a database error.',
              500,
            );
          }
        }
      }
    }

    const user = await this.userRepository.findOne({
      where: {
        rollNo: input.rollNo,
      },
    });

    if (user) {
      user.pendingDates = user.pendingDates.filter(
        (d) => !this.isSameDate(d, this.parseDate(input.date)),
      );

      await this.userRepository.save(user);
    } else {
      throw new HttpException("Internal Server Error: User didn't exist", 500);
    }

    let subjectCodesWithoutDuplicates = [...new Set(schedule)];
    subjectCodesWithoutDuplicates = subjectCodesWithoutDuplicates.filter(
      (s) => s !== '',
    );

    for (const subjectCode of subjectCodesWithoutDuplicates) {
      const subjectId = this.subjectMap.get(subjectCode);
      const attendanceRecord = await this.attendanceRepository.findOne({
        where: {
          studentRollNo: input.rollNo,
          subjectId: new ObjectId(subjectId),
          semesterId: new ObjectId(CURRENT_SEM),
        },
      });

      if (!attendanceRecord)
        throw new HttpException(
          'No attendance record found for given rollno, subject and semester',
          404,
        );

      const recordIndex = attendanceRecord?.attendanceRecords.findIndex((r) =>
        this.isSameDate(this.parseDate(input.date), r.date),
      );
      //Counting the no of true's to get the attended hours
      const attendedHours =
        attendanceRecord.attendanceRecords[recordIndex].attended.filter(
          Boolean,
        ).length;
      console.log(attendedHours);

      attendanceRecord.attendedContactHours += attendedHours;
      attendanceRecord.attendancePercentage =
        (attendanceRecord.attendedContactHours /
          attendanceRecord.totalContactHours) *
        100;

      await this.attendanceRepository.save(attendanceRecord);
    }

    return true;
  }

  async getPendingAttendanceUpdates(rollNo: number) {
    const user = await this.userRepository.findOne({
      where: {
        rollNo: rollNo,
      },
    });

    if (!user) throw new HttpException('Invalid rollno provided', 500);

    // Bad - Defining a type inside a function
    type PendingAttendanceOutputPartial = {
      date: Date;
      schedule: string[];
    };

    let pendingAttendanceOutput: PendingAttendanceOutputPartial[] = [];

    for (const pDate of user.pendingDates) {
      const partialPendingData = {
        date: pDate,
        schedule: await this.getScheduleByDate(pDate),
      };
      pendingAttendanceOutput.push(partialPendingData);
    }

    return pendingAttendanceOutput;
  }

  async createAttendanceRecords() {
    const users = await this.userRepository.find();
    const subjects = await this.subjectRepository.find({
      where: {
        semesterId: new ObjectId(CURRENT_SEM),
      },
    });

    for (const user of users) {
      for (const subject of subjects) {
        await this.attendanceRepository.save({
          semesterId: new ObjectId(CURRENT_SEM),
          studentRollNo: user.rollNo,
          subjectId: subject.id,
          totalContactHours: 0,
          attendedContactHours: 0,
          attendancePercentage: 0,
          attendanceRecords: [],
        });
      }
    }
  }
}
