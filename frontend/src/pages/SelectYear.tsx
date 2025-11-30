import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

const SelectYear = () => {
  const { setUserYear } = useAuth();
  const navigate = useNavigate();

  const years = ['I', 'II', 'III', 'IV'];

  const handleYearSelect = (year: string) => {
    if (setUserYear) {
      setUserYear(year);
    }
    navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 mx-auto">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Select Your Year</CardTitle>
          <CardDescription>Choose your current academic year to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {years.map((year) => (
              <Button
                key={year}
                variant="outline"
                className="h-24 sm:h-32 text-lg sm:text-xl font-semibold button-hover"
                onClick={() => handleYearSelect(year)}
              >
                Year {year}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectYear;
