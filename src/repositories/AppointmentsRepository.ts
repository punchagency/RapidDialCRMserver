import { DataSource, Repository } from "typeorm";
import { Appointment } from "../entities/index.js";
import { getDatabaseManager } from "../config/database.js";

/**
 * Appointments Repository Interface
 */
export interface IAppointmentsRepository {
  getAppointment(id: string): Promise<Appointment | null>;
  getAppointmentByCalendarEventId(googleCalendarEventId: string): Promise<Appointment | null>;
  listAppointmentsByFieldRepAndDate(
    fieldRepId: string,
    date: string
  ): Promise<Appointment[]>;
  listTodayAppointments(territory?: string): Promise<any[]>;
  createAppointment(appointment: Partial<Appointment>): Promise<Appointment>;
  updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Promise<Appointment | null>;
  deleteAppointment(id: string): Promise<void>;
}

/**
 * Appointments Repository Implementation
 */
export class AppointmentsRepository implements IAppointmentsRepository {
  private dataSource: DataSource;
  private appointmentRepo: Repository<Appointment>;

  constructor() {
    this.dataSource = getDatabaseManager().getDataSource();
    this.appointmentRepo = this.dataSource.getRepository(Appointment);
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    return await this.appointmentRepo.findOne({ where: { id } });
  }

  async getAppointmentByCalendarEventId(googleCalendarEventId: string): Promise<Appointment | null> {
    return await this.appointmentRepo.findOne({ where: { googleCalendarEventId } });
  }

  async listAppointmentsByFieldRepAndDate(
    fieldRepId: string,
    date: string
  ): Promise<Appointment[]> {
    return await this.appointmentRepo.find({
      where: { fieldRepId, scheduledDate: date },
      order: { scheduledTime: "ASC" },
    });
  }

  async listTodayAppointments(territory?: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];

    const query = this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.prospect', 'prospect')
      .leftJoinAndSelect('appointment.fieldRep', 'fieldRep')
      .where('appointment.scheduledDate = :today', { today })
      .orderBy('appointment.scheduledTime', 'ASC');

    if (territory) {
      query.andWhere('fieldRep.territory = :territory', { territory });
    }

    const appointments = await query.getMany();

    return appointments.map((app) => ({
      id: app.id,
      scheduledDate: app.scheduledDate,
      scheduledTime: app.scheduledTime,
      durationMinutes: app.durationMinutes,
      status: app.status,
      prospectId: app.prospectId,
      prospectName: app.prospect?.businessName,
      prospectPhone: app.prospect?.phoneNumber,
      prospectAddress: app.prospect?.addressStreet,
      prospectCity: app.prospect?.addressCity,
      fieldRepId: app.fieldRepId,
      fieldRepName: app.fieldRep?.name,
      territory: app.fieldRep?.territory,
    }));
  }

  async createAppointment(
    appointment: Partial<Appointment>
  ): Promise<Appointment> {
    const newAppointment = this.appointmentRepo.create(appointment);
    return await this.appointmentRepo.save(newAppointment);
  }

  async updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Promise<Appointment | null> {
    await this.appointmentRepo.update(id, {
      ...appointment,
      updatedAt: new Date(),
    });
    return await this.getAppointment(id);
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.appointmentRepo.delete(id);
  }
}

// Singleton instance
let appointmentsRepositoryInstance: AppointmentsRepository | null = null;

/**
 * Get singleton instance of AppointmentsRepository
 */
export function getAppointmentsRepository(): AppointmentsRepository {
  if (!appointmentsRepositoryInstance) {
    appointmentsRepositoryInstance = new AppointmentsRepository();
  }
  return appointmentsRepositoryInstance;
}
