import { useState, useEffect } from "react";
import { db } from "@/lib/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle, XCircle, Clock, Save, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

interface Student {
  id: string;
  full_name: string;
  class_name: string | null;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: string;
  notes: string | null;
}

interface AttendanceManagerProps {
  instructorId: string;
  availableClasses: string[];
  canManage: boolean;
  canExport: boolean;
}

const ATTENDANCE_STATUSES = [
  { value: "present", label: "Keldi", color: "bg-green-500" },
  { value: "absent", label: "Kelmadi", color: "bg-red-500" },
  { value: "late", label: "Kechikdi", color: "bg-yellow-500" },
  { value: "excused", label: "Sababli", color: "bg-blue-500" },
];

export function AttendanceManager({
  instructorId,
  availableClasses,
  canManage,
  canExport,
}: AttendanceManagerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);

    const { data: studentsData } = await db
      .from("students")
      .select("id, full_name, class_name")
      .eq("class_name", selectedClass)
      .order("full_name");

    if (studentsData) {
      setStudents(studentsData as Student[]);
      const studentIds = (studentsData as Student[]).map((s) => s.id);

      const { data: attendanceData } = await db
        .from("attendance")
        .select("*")
        .eq("date", selectedDate)
        .in("student_id", studentIds);

      if (attendanceData) {
        setExistingRecords(attendanceData as AttendanceRecord[]);
        const attendanceMap: Record<string, string> = {};
        (attendanceData as AttendanceRecord[]).forEach((record) => {
          attendanceMap[record.student_id] = record.status;
        });
        setAttendance(attendanceMap);
      } else {
        setAttendance({});
        setExistingRecords([]);
      }
    }

    setLoading(false);
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!canManage) {
      toast.error("Sizda davomat boshqarish huquqi yo'q");
      return;
    }

    setSaving(true);

    for (const student of students) {
      const status = attendance[student.id];
      if (!status) continue;

      const existingRecord = existingRecords.find((r) => r.student_id === student.id);

      if (existingRecord) {
        await db.from("attendance").update({ status }).eq("id", existingRecord.id);
      } else {
        await db.from("attendance").insert({
          student_id: student.id,
          instructor_id: instructorId,
          date: selectedDate,
          status,
        });
      }
    }

    toast.success("Davomat saqlandi");
    fetchStudentsAndAttendance();
    setSaving(false);
  };

  const handleExportExcel = () => {
    const data = students.map((student) => ({
      full_name: student.full_name,
      class_name: student.class_name || "—",
      status: ATTENDANCE_STATUSES.find((s) => s.value === attendance[student.id])?.label || "Belgilanmagan",
      date: selectedDate,
    }));

    exportToExcel(data, [
      { header: "O'quvchi", key: "full_name", width: 25 },
      { header: "Sinf", key: "class_name", width: 10 },
      { header: "Holat", key: "status", width: 15 },
      { header: "Sana", key: "date", width: 15 },
    ], `davomat_${selectedDate}`);
    toast.success("Excel fayl yuklab olindi");
  };

  const handleExportPDF = () => {
    const data = students.map((student) => ({
      full_name: student.full_name,
      class_name: student.class_name || "—",
      status: ATTENDANCE_STATUSES.find((s) => s.value === attendance[student.id])?.label || "Belgilanmagan",
      date: selectedDate,
    }));

    exportToPDF(data, [
      { header: "O'quvchi", key: "full_name" },
      { header: "Sinf", key: "class_name" },
      { header: "Holat", key: "status" },
      { header: "Sana", key: "date" },
    ], `Davomat - ${selectedDate}`, `davomat_${selectedDate}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "absent": return <XCircle className="w-4 h-4 text-red-600" />;
      case "late": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "excused": return <Calendar className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;
  const lateCount = Object.values(attendance).filter((s) => s === "late").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sinf</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tanlang" />
            </SelectTrigger>
            <SelectContent>
              {availableClasses.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sana</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {canManage && selectedClass && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        )}

        {canExport && selectedClass && students.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Printer className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        )}
      </div>

      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{students.length}</div><p className="text-xs text-muted-foreground">Jami</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{presentCount}</div><p className="text-xs text-muted-foreground">Keldi</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{absentCount}</div><p className="text-xs text-muted-foreground">Kelmadi</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{lateCount}</div><p className="text-xs text-muted-foreground">Kechikdi</p></CardContent></Card>
        </div>
      )}

      {!selectedClass ? (
        <div className="text-center text-muted-foreground py-12">Sinfni tanlang</div>
      ) : loading ? (
        <div className="text-center text-muted-foreground py-12">Yuklanmoqda...</div>
      ) : students.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Bu sinfda o'quvchilar topilmadi</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O'quvchi</TableHead>
              <TableHead>Holat</TableHead>
              {canManage && <TableHead>Belgilash</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.full_name}</TableCell>
                <TableCell>
                  {attendance[student.id] ? (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(attendance[student.id])}
                      <Badge variant={attendance[student.id] === "present" ? "default" : attendance[student.id] === "absent" ? "destructive" : "secondary"}>
                        {ATTENDANCE_STATUSES.find((s) => s.value === attendance[student.id])?.label}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Belgilanmagan</span>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex gap-1">
                      {ATTENDANCE_STATUSES.map((status) => (
                        <Button key={status.value} variant={attendance[student.id] === status.value ? "default" : "outline"} size="sm" onClick={() => handleStatusChange(student.id, status.value)} className="text-xs px-2">
                          {status.label}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
