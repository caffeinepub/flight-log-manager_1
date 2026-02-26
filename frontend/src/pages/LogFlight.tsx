import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetEntities, useLogFlight } from '../hooks/useQueries';
import { FlightType, LandingType } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { PlaneTakeoff, Loader2, CheckCircle2 } from 'lucide-react';
import {
  getTodayString, isValidTime, isValidDate, calcDurationMinutes,
  formatMinutesToHHMM, dateToNanoseconds
} from '../utils/timeUtils';

interface FormData {
  date: string;
  student: string;
  instructor: string;
  aircraft: string;
  exercise: string;
  flightType: FlightType | '';
  takeoffTime: string;
  landingTime: string;
  landingType: LandingType | '';
  landingCount: string;
}

interface FormErrors {
  date?: string;
  student?: string;
  instructor?: string;
  aircraft?: string;
  exercise?: string;
  flightType?: string;
  takeoffTime?: string;
  landingTime?: string;
  landingType?: string;
  landingCount?: string;
}

export default function LogFlight() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({
    date: getTodayString(),
    student: '',
    instructor: '',
    aircraft: '',
    exercise: '',
    flightType: '',
    takeoffTime: '',
    landingTime: '',
    landingType: '',
    landingCount: '1',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  const { data: students = [] } = useGetEntities('students');
  const { data: instructors = [] } = useGetEntities('instructors');
  const { data: aircraft = [] } = useGetEntities('aircraft');
  const { data: exercises = [] } = useGetEntities('exercises');
  const logFlight = useLogFlight();

  const duration = (isValidTime(form.takeoffTime) && isValidTime(form.landingTime))
    ? calcDurationMinutes(form.takeoffTime, form.landingTime)
    : null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!isValidDate(form.date)) newErrors.date = 'Valid date required (YYYY-MM-DD)';
    if (!form.student) newErrors.student = 'Student is required';
    if (!form.instructor) newErrors.instructor = 'Instructor is required';
    if (!form.aircraft) newErrors.aircraft = 'Aircraft is required';
    if (!form.exercise) newErrors.exercise = 'Exercise is required';
    if (!form.flightType) newErrors.flightType = 'Flight type is required';
    if (!isValidTime(form.takeoffTime)) newErrors.takeoffTime = 'Valid time required (HH:MM)';
    if (!isValidTime(form.landingTime)) newErrors.landingTime = 'Valid time required (HH:MM)';
    if (isValidTime(form.takeoffTime) && isValidTime(form.landingTime)) {
      if (calcDurationMinutes(form.takeoffTime, form.landingTime) <= 0) {
        newErrors.landingTime = 'Landing must be after takeoff';
      }
    }
    if (!form.landingType) newErrors.landingType = 'Landing type is required';
    const count = parseInt(form.landingCount, 10);
    if (isNaN(count) || count < 1) newErrors.landingCount = 'Must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dateObj = new Date(form.date + 'T00:00:00');
    const durationMins = calcDurationMinutes(form.takeoffTime, form.landingTime);

    await logFlight.mutateAsync({
      date: dateToNanoseconds(dateObj),
      student: form.student,
      instructor: form.instructor,
      aircraft: form.aircraft,
      exercise: form.exercise,
      flightType: form.flightType as FlightType,
      takeoffTime: form.takeoffTime,
      landingTime: form.landingTime,
      duration: BigInt(durationMins),
      landingType: form.landingType as LandingType,
      landingCount: BigInt(parseInt(form.landingCount, 10)),
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setForm({
        date: getTodayString(),
        student: '',
        instructor: '',
        aircraft: '',
        exercise: '',
        flightType: '',
        takeoffTime: '',
        landingTime: '',
        landingType: '',
        landingCount: '1',
      });
    }, 2000);
  };

  const setField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <PlaneTakeoff className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Log Flight</h1>
          <p className="text-sm text-muted-foreground">Record a new flight entry</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-medium">Flight logged successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base text-foreground">Flight Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium text-sm">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                className="bg-input border-border text-foreground"
              />
              {errors.date && <p className="text-destructive text-xs">{errors.date}</p>}
            </div>

            {/* Student & Instructor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Student</Label>
                <Select value={form.student} onValueChange={(v) => setField('student', v)}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {students.map(s => (
                      <SelectItem key={s.id.toString()} value={s.name} className="text-popover-foreground">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.student && <p className="text-destructive text-xs">{errors.student}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Instructor</Label>
                <Select value={form.instructor} onValueChange={(v) => setField('instructor', v)}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {instructors.map(i => (
                      <SelectItem key={i.id.toString()} value={i.name} className="text-popover-foreground">
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.instructor && <p className="text-destructive text-xs">{errors.instructor}</p>}
              </div>
            </div>

            {/* Aircraft & Exercise */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Aircraft</Label>
                <Select value={form.aircraft} onValueChange={(v) => setField('aircraft', v)}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {aircraft.map(a => (
                      <SelectItem key={a.id.toString()} value={a.name} className="text-popover-foreground">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.aircraft && <p className="text-destructive text-xs">{errors.aircraft}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Exercise</Label>
                <Select value={form.exercise} onValueChange={(v) => setField('exercise', v)}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {exercises.map(ex => (
                      <SelectItem key={ex.id.toString()} value={ex.name} className="text-popover-foreground">
                        {ex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.exercise && <p className="text-destructive text-xs">{errors.exercise}</p>}
              </div>
            </div>

            {/* Flight Type */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium text-sm">Flight Type</Label>
              <Select value={form.flightType} onValueChange={(v) => setField('flightType', v)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Solo or Dual?" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value={FlightType.solo} className="text-popover-foreground">Solo</SelectItem>
                  <SelectItem value={FlightType.dual} className="text-popover-foreground">Dual</SelectItem>
                </SelectContent>
              </Select>
              {errors.flightType && <p className="text-destructive text-xs">{errors.flightType}</p>}
            </div>

            {/* Times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Takeoff Time</Label>
                <Input
                  type="time"
                  value={form.takeoffTime}
                  onChange={(e) => setField('takeoffTime', e.target.value)}
                  className="bg-input border-border text-foreground font-mono"
                  placeholder="HH:MM"
                />
                {errors.takeoffTime && <p className="text-destructive text-xs">{errors.takeoffTime}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Landing Time</Label>
                <Input
                  type="time"
                  value={form.landingTime}
                  onChange={(e) => setField('landingTime', e.target.value)}
                  className="bg-input border-border text-foreground font-mono"
                  placeholder="HH:MM"
                />
                {errors.landingTime && <p className="text-destructive text-xs">{errors.landingTime}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Duration</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-secondary border border-border">
                  <span className="font-mono text-sm font-semibold text-primary">
                    {duration !== null && duration > 0
                      ? formatMinutesToHHMM(duration)
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Landing Type & Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Landing Type</Label>
                <Select value={form.landingType} onValueChange={(v) => setField('landingType', v)}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Day or Night?" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value={LandingType.day} className="text-popover-foreground">☀️ Day</SelectItem>
                    <SelectItem value={LandingType.night} className="text-popover-foreground">🌙 Night</SelectItem>
                  </SelectContent>
                </Select>
                {errors.landingType && <p className="text-destructive text-xs">{errors.landingType}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground font-medium text-sm">Landing Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.landingCount}
                  onChange={(e) => setField('landingCount', e.target.value)}
                  className="bg-input border-border text-foreground"
                />
                {errors.landingCount && <p className="text-destructive text-xs">{errors.landingCount}</p>}
              </div>
            </div>

            {logFlight.isError && (
              <p className="text-destructive text-sm">Failed to log flight. Please try again.</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={logFlight.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold"
              >
                {logFlight.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PlaneTakeoff className="w-4 h-4 mr-2" />
                    Log Flight
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/flight-records' })}
                className="border-border text-foreground hover:bg-secondary"
              >
                View Records
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
