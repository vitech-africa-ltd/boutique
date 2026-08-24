import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  Save, 
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface Shift {
  id: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  status: 'present' | 'absent' | 'late' | 'scheduled';
  checkIn?: string;
  checkOut?: string;
}

const INITIAL_SHIFTS: Shift[] = [
  { id: '1', employeeName: 'Alain Tchakounté', startTime: '08:00', endTime: '18:00', status: 'present', checkIn: '07:55', checkOut: '18:05' },
  { id: '2', employeeName: 'Sonia Bella', startTime: '08:00', endTime: '18:00', status: 'late', checkIn: '08:20' },
  { id: '3', employeeName: 'Paul Atangana', startTime: '09:00', endTime: '17:00', status: 'absent' },
  { id: '4', employeeName: 'Marie Ngo', startTime: '08:00', endTime: '18:00', status: 'scheduled' },
];

const EMPLOYEES = [
  'Alain Tchakounté',
  'Sonia Bella',
  'Paul Atangana',
  'Marie Ngo'
];

export function Planning() {
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [absences, setAbsences] = useState<Record<string, string[]>>({
    [format(new Date(), 'yyyy-MM-dd')]: ['Paul Atangana']
  });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentViewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentViewDate]);

  const toggleAbsence = (employeeName: string, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setAbsences(prev => {
      const currentAbsences = prev[dateKey] || [];
      const newAbsences = currentAbsences.includes(employeeName)
        ? currentAbsences.filter(name => name !== employeeName)
        : [...currentAbsences, employeeName];
      
      return {
        ...prev,
        [dateKey]: newAbsences
      };
    });
    
    // Also update shifts if it's today
    if (isSameDay(date, new Date())) {
      setShifts(prev => prev.map(s => {
        if (s.employeeName === employeeName) {
          const isMarkedAbsent = !(absences[dateKey]?.includes(employeeName));
          return { ...s, status: isMarkedAbsent ? 'absent' : 'scheduled' };
        }
        return s;
      }));
    }
    
    toast.success(`Statut de ${employeeName} mis à jour`);
  };

  const nextMonth = () => setCurrentViewDate(addMonths(currentViewDate, 1));
  const prevMonth = () => setCurrentViewDate(subMonths(currentViewDate, 1));

  const absencesForSelectedDay = absences[format(selectedDay, 'yyyy-MM-dd')] || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Planning & Présences</h2>
          <p className="text-sm text-muted-foreground">Suivez le pointage et organisez les rotations de votre équipe.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-border hover:bg-white/5 h-9 text-[12px]">
            <Download className="w-4 h-4" />
            Rapport Hebdo
          </Button>
          <Button className="gap-2 bg-[#00A3FF] hover:bg-[#0082CC] h-9 text-[12px]">
            <Save className="w-4 h-4" />
            Enregistrer Modif.
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="bg-[#1F2125] border-border border-l-4 border-l-[#00A3FF]">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Effectif ce Jour</span>
              <UserCheck className="w-4 h-4 text-[#00A3FF]" />
            </div>
            <div className="text-2xl font-bold text-white">04</div>
            <p className="text-[10px] text-muted-foreground mt-1">Personnel planifié</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border border-l-4 border-l-[#00E676]">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Présents</span>
              <div className="w-4 h-4 rounded-full bg-[#00E676]/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">02</div>
            <p className="text-[10px] text-muted-foreground mt-1">Pointage effectué</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border border-l-4 border-l-[#FFB300]">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Retards</span>
              <AlertCircle className="w-4 h-4 text-[#FFB300]" />
            </div>
            <div className="text-2xl font-bold text-white">{shifts.filter(s => s.status === 'late').length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Attention requise</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1F2125] border-border border-l-4 border-l-[#FF4D4D]">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Absents</span>
              <UserX className="w-4 h-4 text-[#FF4D4D]" />
            </div>
            <div className="text-2xl font-bold text-white">{shifts.filter(s => s.status === 'absent').length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Non justifié</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-[#1F2125] border-border overflow-hidden">
            <CardHeader className="p-4 border-b border-border bg-[#151619] flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                 <CalendarIcon className="w-4 h-4 text-[#00A3FF]" />
                 <CardTitle className="text-sm font-bold text-white capitalize">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] border-[#00A3FF]/20 text-[#00A3FF] bg-[#00A3FF]/5 uppercase font-black">Pointage Direct</Badge>
            </CardHeader>
            <Table>
              <TableHeader className="bg-[#151619]/50">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3">Employé</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Horaires</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-center">Statut</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground px-6 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow 
                    key={shift.id} 
                    className={cn(
                      "hover:bg-white/[0.02] border-b border-border transition-colors",
                      shift.status === 'absent' && "bg-[#FF4D4D]/5",
                      shift.status === 'late' && "bg-[#FFB300]/5"
                    )}
                  >
                    <TableCell className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{shift.employeeName}</span>
                    </TableCell>
                    <TableCell className="text-center px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-[#111214] text-[11px] text-muted-foreground font-mono">
                        <Clock className="w-3 h-3" />
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-6 py-4">
                      <Badge className={cn(
                        "text-[9px] font-bold border-none px-2 py-0.5",
                        shift.status === 'present' ? "bg-[#00E676]/20 text-[#00E676]" :
                        shift.status === 'late' ? "bg-[#FFB300]/20 text-[#FFB300]" :
                        shift.status === 'absent' ? "bg-[#FF4D4D]/20 text-[#FF4D4D]" :
                        "bg-white/10 text-muted-foreground"
                      )}>
                        {shift.status === 'present' ? 'PRÉSENT' : 
                         shift.status === 'late' ? 'RETARD' : 
                         shift.status === 'absent' ? 'ABSENT' : 'PLANIFIÉ'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-7 text-[10px] transition-colors",
                          shift.status === 'absent' ? "text-[#00E676] hover:bg-[#00E676]/10" : "text-[#FF4D4D] hover:bg-[#FF4D4D]/10"
                        )}
                        onClick={() => toggleAbsence(shift.employeeName, new Date())}
                       >
                         {shift.status === 'absent' ? 'Marquer Présent' : 'Marquer Absent'}
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="bg-[#1F2125] border-border overflow-hidden">
            <CardHeader className="p-4 border-b border-border bg-[#151619] flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-[#00A3FF]" />
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Suivi des Absences par Calendrier</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-bold text-white min-w-[100px] text-center capitalize">
                  {format(currentViewDate, 'MMMM yyyy', { locale: fr })}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-px bg-border/20 rounded-xl overflow-hidden border border-border/20">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="bg-[#151619] p-2 text-center text-[10px] font-black uppercase text-muted-foreground">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => {
                  const dayAbsences = absences[format(day, 'yyyy-MM-dd')] || [];
                  const isDaySelected = isSameDay(day, selectedDay);
                  const isCurrentMonth = isSameMonth(day, currentViewDate);

                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "bg-[#1F2125] min-h-[80px] p-2 transition-all cursor-pointer relative group border-r border-b border-border/10 last:border-r-0",
                        !isCurrentMonth && "opacity-20 grayscale",
                        isDaySelected && "ring-2 ring-primary z-10 bg-primary/5",
                        isToday(day) && "bg-primary/10"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-bold",
                        isToday(day) ? "text-primary" : "text-white"
                      )}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="mt-1 space-y-1">
                        {dayAbsences.map((name, i) => (
                          <div key={i} className="text-[9px] bg-[#FF4D4D]/20 text-[#FF4D4D] px-1.5 py-0.5 rounded border border-[#FF4D4D]/10 truncate font-bold uppercase tracking-tighter">
                            {name.split(' ')[0]}
                          </div>
                        ))}
                      </div>

                      {dayAbsences.length > 0 && (
                        <div className="absolute top-2 right-2 flex gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-[#FF4D4D]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1F2125] border-border overflow-hidden">
            <CardHeader className="bg-[#151619] border-b border-border p-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-[#00A3FF]">Détails du {format(selectedDay, 'd MMMM', { locale: fr })}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Cliquez pour marquer absent</p>
              <div className="space-y-2">
                {EMPLOYEES.map(emp => {
                  const isAbsent = absences[format(selectedDay, 'yyyy-MM-dd')]?.includes(emp);
                  return (
                    <Button
                      key={emp}
                      variant="ghost"
                      className={cn(
                        "w-full justify-between h-12 rounded-xl border border-transparent transition-all",
                        isAbsent 
                          ? "bg-[#FF4D4D]/10 border-[#FF4D4D]/20 text-[#FF4D4D]" 
                          : "bg-white/5 border-border hover:bg-white/10 text-white"
                      )}
                      onClick={() => toggleAbsence(emp, selectedDay)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          isAbsent ? "bg-[#FF4D4D] shadow-[0_0_8px_rgba(255,77,77,0.5)]" : "bg-[#00E676]"
                        )} />
                        <span className="text-xs font-bold">{emp}</span>
                      </div>
                      {isAbsent ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4 text-emerald-500 opacity-50" />}
                    </Button>
                  );
                })}
              </div>
              
              {absencesForSelectedDay.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-[#FF4D4D]/5 border border-[#FF4D4D]/10 text-center">
                  <AlertCircle className="w-5 h-5 text-[#FF4D4D] mx-auto mb-2" />
                  <p className="text-[11px] font-bold text-[#FF4D4D]">{absencesForSelectedDay.length} absence(s) signalée(s)</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Impact sur la rotation estimé à -25%</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1F2125] border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white">Anomalies Recurrentes (7j)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="p-3 rounded-lg bg-white/[0.03] border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF4D4D]" />
                    <span className="text-[12px] text-white">Paul Atangana</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Hier</span>
               </div>
               <div className="p-3 rounded-lg bg-white/[0.03] border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FFB300]" />
                    <span className="text-[12px] text-white">Sonia Bella</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">3 retards</span>
               </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#111214] border-dashed border-border/50 flex flex-col items-center justify-center p-6 text-center">
             <div className="w-10 h-10 rounded-full bg-[#1F2125] flex items-center justify-center mb-3">
               <UserCheck className="w-5 h-5 text-muted-foreground/30" />
             </div>
             <h4 className="text-xs font-bold text-white uppercase tracking-widest">Calcul Paie</h4>
             <p className="text-[10px] text-muted-foreground max-w-[150px] mb-4">Prêt pour l'exportation des présences.</p>
             <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest">Exporter</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
