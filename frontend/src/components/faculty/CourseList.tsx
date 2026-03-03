import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Course {
    _id: string;
    subject_name: string;
    subject_code: string;
    degree: string;
    department: string;
    year: string;
    semester: number;
    section: string;
    academic_year: string;
}

interface CourseListProps {
    courses: Course[];
    onAdd: () => void;
    onDelete: (id: string) => void;
}

const CourseList = ({ courses, onAdd, onDelete }: CourseListProps) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">My Courses</h2>
                <Button size="sm" onClick={onAdd} className="shadow-sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Subject
                </Button>
            </div>

            {courses.length === 0 ? (
                <Card className="border-dashed shadow-none bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <BookOpen className="h-10 w-10 mb-3 opacity-20" />
                        <p>No subjects allocated yet.</p>
                        <Button variant="link" onClick={onAdd} className="mt-2">Assign your first subject</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courses.map((course) => (
                        <Card key={course._id} className="group relative overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary/70 hover:border-l-primary">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                                            {course.subject_name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                {course.subject_code || 'No Code'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs font-normal bg-background">
                                                {course.degree}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3"
                                        onClick={() => onDelete(course._id)}
                                        title="Remove Course"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex flex-col bg-muted/50 p-2 rounded-md">
                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Class</span>
                                        <span className="font-medium">
                                            Year {course.year} / Sem {course.semester}
                                        </span>
                                    </div>
                                    <div className="flex flex-col bg-muted/50 p-2 rounded-md">
                                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Section</span>
                                        <span className="font-medium text-center">{course.section}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {course.academic_year}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseList;
