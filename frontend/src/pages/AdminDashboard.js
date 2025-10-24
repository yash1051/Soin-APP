import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogOut, Download, Users, FileText, UserCheck, Clock, ZoomIn, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    pending_doctors: 0,
    total_submissions: 0
  });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, filterType, submissions]);

  const fetchData = async () => {
    try {
      const [statsRes, doctorsRes, submissionsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/pending-doctors`),
        axios.get(`${API}/submissions`)
      ]);

      setStats(statsRes.data);
      setPendingDoctors(doctorsRes.data);
      setSubmissions(submissionsRes.data);
      setFilteredSubmissions(submissionsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorApproval = async (doctorId, approve) => {
    try {
      await axios.post(`${API}/admin/approve-doctor/${doctorId}?approve=${approve}`);
      toast.success(approve ? 'Doctor approved!' : 'Doctor rejected');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update doctor status');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API}/admin/export-data`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `soin_export_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.patient_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((sub) => sub.diabetes_type === filterType);
    }

    setFilteredSubmissions(filtered);
  };

  return (
    <div className="min-h-screen beige-gradient">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur-md border-b-2 border-[#8B7355]/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#5D4E37]">Admin Dashboard</h1>
            <p className="text-sm text-[#8B7355]">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExport}
              className="bg-[#8B7355] hover:bg-[#5D4E37] text-white"
              disabled={exporting}
              data-testid="export-data-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>
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
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#8B7355]/20 card-hover" data-testid="stats-patients">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8B7355]">Total Patients</p>
                  <p className="text-3xl font-bold text-[#5D4E37]">{stats.total_patients}</p>
                </div>
                <Users className="w-10 h-10 text-[#8B7355]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#8B7355]/20 card-hover" data-testid="stats-doctors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8B7355]">Approved Doctors</p>
                  <p className="text-3xl font-bold text-[#5D4E37]">{stats.total_doctors}</p>
                </div>
                <UserCheck className="w-10 h-10 text-[#8B7355]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#8B7355]/20 card-hover" data-testid="stats-pending">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8B7355]">Pending Doctors</p>
                  <p className="text-3xl font-bold text-[#5D4E37]">{stats.pending_doctors}</p>
                </div>
                <Clock className="w-10 h-10 text-[#8B7355]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#8B7355]/20 card-hover" data-testid="stats-submissions">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8B7355]">Total Submissions</p>
                  <p className="text-3xl font-bold text-[#5D4E37]">{stats.total_submissions}</p>
                </div>
                <FileText className="w-10 h-10 text-[#8B7355]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content - Tabs */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="pending" data-testid="pending-tab">
              Pending Approvals ({pendingDoctors.length})
            </TabsTrigger>
            <TabsTrigger value="submissions" data-testid="submissions-tab">
              All Submissions
            </TabsTrigger>
          </TabsList>

          {/* Pending Doctors Tab */}
          <TabsContent value="pending">
            <Card className="border-2 border-[#8B7355]/20">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-[#5D4E37]">Pending Doctor Approvals</CardTitle>
                <CardDescription className="text-[#8B7355]">
                  Review and approve doctor registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDoctors.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-[#8B7355]">No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDoctors.map((doctor) => (
                      <Card key={doctor.id} className="border-[#8B7355]/20" data-testid="pending-doctor-card">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="text-lg font-semibold text-[#5D4E37]">{doctor.name}</p>
                              <p className="text-sm text-[#8B7355]">{doctor.email}</p>
                              <p className="text-xs text-[#8B7355]">
                                Registered: {format(new Date(doctor.created_at), 'PPp')}
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleDoctorApproval(doctor.id, true)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid="approve-doctor-btn"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleDoctorApproval(doctor.id, false)}
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                data-testid="reject-doctor-btn"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Submissions Tab */}
          <TabsContent value="submissions">
            <div className="space-y-6">
              {/* Filters */}
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
                          data-testid="admin-search-input"
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-64">
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger data-testid="admin-filter-select">
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

              {/* Submissions List */}
              {filteredSubmissions.length === 0 ? (
                <Card className="border-2 border-[#8B7355]/20">
                  <CardContent className="p-12 text-center">
                    <p className="text-xl text-[#8B7355]">No submissions found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((submission) => (
                    <Card key={submission.id} className="border-2 border-[#8B7355]/20 card-hover" data-testid="admin-submission-card">
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-4 gap-6">
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
                              data-testid="admin-tongue-image"
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

                          {/* Data */}
                          <div className="md:col-span-3 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-lg font-semibold text-[#5D4E37]">{submission.patient_name}</p>
                                <p className="text-sm text-[#8B7355]">{submission.patient_email}</p>
                                <p className="text-sm text-[#8B7355]">Age: {submission.patient_age}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-[#8B7355]">Submitted</p>
                                <p className="font-semibold text-[#5D4E37]">
                                  {format(new Date(submission.created_at), 'PPp')}
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
                                  <p className="text-xs text-[#8B7355]">Insulin Level</p>
                                  <p className="font-semibold text-[#5D4E37]">{submission.insulin_level}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-[#8B7355]">Diabetes Type</p>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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

export default AdminDashboard;
