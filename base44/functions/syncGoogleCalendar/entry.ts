import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// Google Calendar sync for Eden Skye's scheduling.
// Uses the SHARED googlecalendar connector (builder's account — info@hiddenpropertyintel.com alias).

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action;

    // Get the OAuth access token for Google Calendar
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // LIST — upcoming events (default next 14 days)
    if (action === 'list') {
      const days = body.days || 14;
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const res = await fetch(url, { headers: authHeader });
      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.error?.message || 'Calendar API error' }, { status: res.status });
      }
      const data = await res.json();
      const events = (data.items || []).map((e: any) => ({
        id: e.id,
        summary: e.summary || '(No title)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location,
        attendees: (e.attendees || []).map((a: any) => ({ email: a.email, name: a.displayName, response: a.responseStatus })),
        description: e.description,
        hangoutLink: e.hangoutLink,
      }));
      return Response.json({ events, count: events.length });
    }

    // TODAY — today's events
    if (action === 'today') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const res = await fetch(url, { headers: authHeader });
      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.error?.message || 'Calendar API error' }, { status: res.status });
      }
      const data = await res.json();
      const events = (data.items || []).map((e: any) => ({
        id: e.id,
        summary: e.summary || '(No title)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location,
        attendees: (e.attendees || []).map((a: any) => ({ email: a.email, response: a.responseStatus })),
        hangoutLink: e.hangoutLink,
      }));
      return Response.json({ events, count: events.length, date: startOfDay });
    }

    // CREATE — schedule a new event (call, meeting, closing)
    if (action === 'create') {
      const { title, start_time, end_time, attendees, description, location } = body;
      if (!title || !start_time || !end_time) {
        return Response.json({ error: 'title, start_time, and end_time are required' }, { status: 400 });
      }
      const eventPayload: any = {
        summary: title,
        description: description || `Scheduled by Eden Skye — Hidden Property Intel`,
        start: { dateTime: new Date(start_time).toISOString() },
        end: { dateTime: new Date(end_time).toISOString() },
      };
      if (location) eventPayload.location = location;
      if (Array.isArray(attendees) && attendees.length > 0) {
        eventPayload.attendees = attendees.map((email: string) => ({ email }));
      }
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(eventPayload),
      });
      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.error?.message || 'Failed to create event' }, { status: res.status });
      }
      const event = await res.json();
      return Response.json({
        success: true,
        event_id: event.id,
        summary: event.summary,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        hangoutLink: event.hangoutLink,
        htmlLink: event.htmlLink,
      });
    }

    // FIND_SLOTS — find available time slots in the next N days
    if (action === 'find_slots') {
      const days = body.days || 5;
      const duration_min = body.duration_min || 30;
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100`;
      const res = await fetch(url, { headers: authHeader });
      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.error?.message || 'Calendar API error' }, { status: res.status });
      }
      const data = await res.json();
      const busy = (data.items || []).map((e: any) => ({
        start: new Date(e.start?.dateTime || e.start?.date),
        end: new Date(e.end?.dateTime || e.end?.date),
      }));
      // Find 3 available 30-min slots in business hours (9 AM - 6 PM ET) on weekdays
      const slots = [];
      const now = new Date();
      for (let d = 1; d <= days && slots.length < 5; d++) {
        const day = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
        // Skip weekends
        if (day.getDay() === 0 || day.getDay() === 6) continue;
        for (let h = 9; h <= 17 && slots.length < 5; h++) {
          const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, 0);
          const slotEnd = new Date(slotStart.getTime() + duration_min * 60 * 1000);
          // Skip if in the past
          if (slotStart <= now) continue;
          // Check if slot conflicts with any busy event
          const conflict = busy.some(b => slotStart < b.end && slotEnd > b.start);
          if (!conflict) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              label: slotStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            });
          }
        }
      }
      return Response.json({ slots, count: slots.length });
    }

    return Response.json({ error: 'Unknown action. Use: list, today, create, find_slots' }, { status: 400 });
  } catch (error) {
    console.error('syncGoogleCalendar error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}