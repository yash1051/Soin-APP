import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, Search, ZoomIn, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DoctorDashboard = ({ user, onLogout }) => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, filterType, submissions]);

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API}/submissions`);
      setSubmissions(response.data);
      setFilteredSubmissions(response.data);
    } catch (error) {
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.patient_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Diabetes type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((sub) => sub.diabetes_type === filterType);
    }

    setFilteredSubmissions(filtered);
  };

  // Group submissions by patient
  const groupedSubmissions = filteredSubmissions.reduce((acc, submission) => {
    if (!acc[submission.patient_id]) {
      acc[submission.patient_id] = {
        patient_name: submission.patient_name,
        patient_email: submission.patient_email,
        patient_age: submission.patient_age,
        submissions: []
      };
    }
    acc[submission.patient_id].submissions.push(submission);
    return acc;
  }, {});

  return (
    <div className="min-h-screen beige-gradient">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur-md border-b-2 border-[#8B7355]/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#5D4E37]">Doctor Dashboard</h1>
            <p className="text-sm text-[#8B7355]">Welcome, Dr. {user.name}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="border-[#8B7355] text-[#8B7355] hover:bg-[#8B7355] hover:text-white"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card className="border-2 border-[#8B7355]/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B7355] w-5 h-5" />
                  <Input
                    placeholder="Search by patient name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger data-testid="filter-type-select">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Type 1">Type 1</SelectItem>
                    <SelectItem value="Type 2">Type 2</SelectItem>
                    <SelectItem value="Prediabetes">Prediabetes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-[#8B7355] animate-pulse">Loading submissions...</div>
          </div>
        ) : Object.keys(groupedSubmissions).length === 0 ? (
          <Card className="border-2 border-[#8B7355]/20">
            <CardContent className="p-12 text-center">
              <p className="text-xl text-[#8B7355]">No patient submissions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSubmissions).map(([patientId, patientData]) => (
              <Card key={patientId} className="border-2 border-[#8B7355]/20 shadow-lg" data-testid="patient-group-card">
                <CardHeader className="bg-[#8B7355]/5">
                  <CardTitle className="text-xl font-serif text-[#5D4E37]">
                    {patientData.patient_name}
                  </CardTitle>
                  <div className="flex gap-4 text-sm text-[#8B7355]">
                    <span>{patientData.patient_email}</span>
                    <span>Age: {patientData.patient_age}</span>
                    <span>Total Submissions: {patientData.submissions.length}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {patientData.submissions
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .map((submission) => (
                        <div
                          key={submission.id}
                          className="border border-[#8B7355]/20 rounded-lg p-4 card-hover"
                          data-testid="submission-detail-card"
                        >
                          <div className="grid md:grid-cols-4 gap-4">
                            {/* Image */}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-[#5D4E37]">Tongue Image</p>
                              <img
                                src={`${API}${submission.tongue_image_url}`}
                                alt="Tongue"
                                className="rounded-lg border border-[#8B7355]/30 cursor-zoom-in w-full"
                                onClick={() => {
                                  setSelectedImage(`${API}${submission.tongue_image_url}`);
                                  setImageZoom(true);
                                }}
                                data-testid="doctor-tongue-image"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedImage(`${API}${submission.tongue_image_url}`);
                                  setImageZoom(true);
                                }}
                              >
                                <ZoomIn className="w-4 h-4 mr-2" />
                                Zoom
                              </Button>
                            </div>

                            {/* Medical Data */}
                            <div className="md:col-span-3 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm text-[#8B7355]">Date</p>
                                  <p className="font-semibold text-[#5D4E37]">
                                    {format(new Date(submission.created_at), 'PPpp')}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-[#8B7355]">Blood Glucose</p>
                                  <p className="font-semibold text-[#5D4E37]">{submission.blood_glucose} mg/dL</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#8B7355]">HbA1c</p>
                                  <p className="font-semibold text-[#5D4E37]">{submission.hba1c}%</p>
                                </div>
                                {submission.insulin_level && (
                                  <div>
                                    <p className="text-xs text-[#8B7355]">Insulin</p>
                                    <p className="font-semibold text-[#5D4E37]">{submission.insulin_level}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-[#8B7355]">Type</p>
                                  <p className="font-semibold text-[#5D4E37]">{submission.diabetes_type}</p>
                                </div>
                              </div>

                              {submission.symptoms.length > 0 && (
                                <div>
                                  <p className="text-sm text-[#8B7355] mb-2">Symptoms</p>
                                  <div className="flex flex-wrap gap-2">
                                    {submission.symptoms.map((symptom, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-[#8B7355]/10 text-[#5D4E37] rounded-full text-xs"
                                      >
                                        {symptom}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {submission.medications.length > 0 && (
                                <div>
                                  <p className="text-sm text-[#8B7355] mb-2">Medications</p>
                                  <div className="flex flex-wrap gap-2">
                                    {submission.medications.map((med, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-[#8B7355]/10 text-[#5D4E37] rounded-full text-xs"
                                      >
                                        {med}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {submission.notes && (
                                <div>
                                  <p className="text-sm text-[#8B7355]">Notes</p>
                                  <p className="text-sm text-[#5D4E37]">{submission.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={imageZoom} onOpenChange={setImageZoom}>
        <DialogContent className="max-w-4xl" data-testid="image-zoom-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-[#5D4E37]">Tongue Image - Detailed View</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Zoomed tongue"
              className="w-full rounded-lg"
              data-testid="zoomed-image"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;