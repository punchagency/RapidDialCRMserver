import { google } from 'googleapis';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

/**
 * Calendar Service Class
 * Handles all Google Calendar-related operations
 */
export class CalendarService {
 private clientId: string | undefined;
 private clientSecret: string | undefined;
 private redirectUri: string | undefined;
 private oauth2Client: OAuth2Client | null = null;

 constructor() {
  this.clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  this.clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  this.redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:5173/auth/google/callback';

  if (!this.clientId || !this.clientSecret) {
   console.warn(
    'Google Calendar credentials not fully configured. Missing: ' +
    (!this.clientId ? 'GOOGLE_CALENDAR_CLIENT_ID' : '') +
    (!this.clientSecret ? 'GOOGLE_CALENDAR_CLIENT_SECRET' : '')
   );
  } else {
   this.oauth2Client = new google.auth.OAuth2(
    this.clientId,
    this.clientSecret,
    this.redirectUri
   );
  }
 }

 /**
  * Check if Google Calendar is configured
  */
 isConfigured(): boolean {
  return !!(this.clientId && this.clientSecret && this.oauth2Client);
 }

 /**
  * Get OAuth2 authorization URL
  */
 getAuthUrl(userId?: string): string {
  if (!this.oauth2Client) {
   throw new Error('Google Calendar is not configured');
  }

  const scopes = [
   'https://www.googleapis.com/auth/calendar',
   'https://www.googleapis.com/auth/calendar.events',
  ];

  const state = userId ? JSON.stringify({ userId }) : undefined;

  return this.oauth2Client.generateAuthUrl({
   access_type: 'offline',
   scope: scopes,
   prompt: 'consent',
   state,
  });
 }

 /**
  * Exchange authorization code for tokens
  */
 async getTokens(code: string): Promise<{ accessToken: string; refreshToken: string | null }> {
  if (!this.oauth2Client) {
   throw new Error('Google Calendar is not configured');
  }

  const { tokens } = await this.oauth2Client.getToken(code);

  if (!tokens.access_token) {
   throw new Error('Failed to get access token');
  }

  return {
   accessToken: tokens.access_token,
   refreshToken: tokens.refresh_token || null,
  };
 }

 /**
  * Set credentials for a user
  */
 setCredentials(accessToken: string, refreshToken?: string | null): void {
  if (!this.oauth2Client) {
   throw new Error('Google Calendar is not configured');
  }

  this.oauth2Client.setCredentials({
   access_token: accessToken,
   refresh_token: refreshToken,
  });
 }

 /**
  * Refresh access token using refresh token
  */
 async refreshAccessToken(refreshToken: string): Promise<string> {
  if (!this.oauth2Client) {
   throw new Error('Google Calendar is not configured');
  }

  this.oauth2Client.setCredentials({
   refresh_token: refreshToken,
  });

  const { credentials } = await this.oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
   throw new Error('Failed to refresh access token');
  }

  return credentials.access_token;
 }

 /**
  * Get calendar client
  */
 private getCalendarClient() {
  if (!this.oauth2Client) {
   throw new Error('Google Calendar is not configured or not authenticated');
  }

  return google.calendar({ version: 'v3', auth: this.oauth2Client });
 }

 /**
  * List calendars
  */
 async listCalendars(): Promise<any[]> {
  const calendar = this.getCalendarClient();
  const response = await calendar.calendarList.list();
  return response.data.items || [];
 }

 /**
  * Get primary calendar ID
  */
 async getPrimaryCalendarId(): Promise<string> {
  const calendar = this.getCalendarClient();
  const response = await calendar.calendars.get({ calendarId: 'primary' });
  return response.data.id || 'primary';
 }

 /**
  * Create an event in Google Calendar
  */
 async createEvent(eventData: {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  location?: string;
  attendees?: Array<{ email: string }>;
  calendarId?: string;
 }): Promise<any> {
  const calendar = this.getCalendarClient();
  const calendarId = eventData.calendarId || 'primary';

  const event = {
   summary: eventData.summary,
   description: eventData.description,
   start: eventData.start,
   end: eventData.end,
   location: eventData.location,
   attendees: eventData.attendees,
  };

  const response = await calendar.events.insert({
   calendarId,
   requestBody: event,
  });

  return response.data;
 }

 /**
  * Update an event in Google Calendar
  */
 async updateEvent(
  eventId: string,
  eventData: {
   summary?: string;
   description?: string;
   start?: { dateTime: string; timeZone?: string } | { date: string };
   end?: { dateTime: string; timeZone?: string } | { date: string };
   location?: string;
   attendees?: Array<{ email: string }>;
   calendarId?: string;
  }
 ): Promise<any> {
  const calendar = this.getCalendarClient();
  const calendarId = eventData.calendarId || 'primary';

  const event: any = {};
  if (eventData.summary) event.summary = eventData.summary;
  if (eventData.description) event.description = eventData.description;
  if (eventData.start) event.start = eventData.start;
  if (eventData.end) event.end = eventData.end;
  if (eventData.location) event.location = eventData.location;
  if (eventData.attendees) event.attendees = eventData.attendees;

  const response = await calendar.events.update({
   calendarId,
   eventId,
   requestBody: event,
  });

  return response.data;
 }

 /**
  * Delete an event from Google Calendar
  */
 async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
  const calendar = this.getCalendarClient();
  await calendar.events.delete({
   calendarId,
   eventId,
  });
 }

 /**
  * List events from Google Calendar
  */
 async listEvents(params: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  calendarId?: string;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
 }): Promise<any[]> {
  const calendar = this.getCalendarClient();
  const calendarId = params.calendarId || 'primary';

  const response = await calendar.events.list({
   calendarId,
   timeMin: params.timeMin,
   timeMax: params.timeMax,
   maxResults: params.maxResults || 250,
   singleEvents: params.singleEvents !== false,
   orderBy: params.orderBy || 'startTime',
  });

  return response.data.items || [];
 }

 /**
  * Get a specific event
  */
 async getEvent(eventId: string, calendarId: string = 'primary'): Promise<any> {
  const calendar = this.getCalendarClient();
  const response = await calendar.events.get({
   calendarId,
   eventId,
  });
  return response.data;
 }

 /**
  * Sync appointments from database to Google Calendar
  */
 async syncAppointmentsToCalendar(
  appointments: Array<{
   id: string;
   prospectId?: string;
   fieldRepId?: string;
   scheduledDate: string;
   scheduledTime: string;
   durationMinutes: number;
   notes?: string;
   place?: string;
   googleCalendarEventId?: string;
   prospect?: { businessName?: string };
   fieldRep?: { name?: string };
  }>,
  accessToken: string,
  refreshToken?: string | null
 ): Promise<{ created: number; updated: number; errors: number }> {
  this.setCredentials(accessToken, refreshToken);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const appointment of appointments) {
   try {
    const startDateTime = new Date(`${appointment.scheduledDate}T${appointment.scheduledTime}`);
    const endDateTime = new Date(startDateTime.getTime() + appointment.durationMinutes * 60000);

    const eventData = {
     summary: appointment.prospect?.businessName || 'Appointment',
     description: appointment.notes || '',
     start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
     },
     end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
     },
     location: appointment.place || '',
    };

    if (appointment.googleCalendarEventId) {
     // Update existing event
     await this.updateEvent(appointment.googleCalendarEventId, eventData);
     updated++;
    } else {
     // Create new event
     const event = await this.createEvent(eventData);
     // Note: The caller should update the appointment with googleCalendarEventId
     created++;
    }
   } catch (error) {
    console.error(`Error syncing appointment ${appointment.id}:`, error);
    errors++;
   }
  }

  return { created, updated, errors };
 }
}

// Singleton instance
let calendarServiceInstance: CalendarService | null = null;

export const getCalendarService = (): CalendarService => {
 if (!calendarServiceInstance) {
  calendarServiceInstance = new CalendarService();
 }
 return calendarServiceInstance;
};

