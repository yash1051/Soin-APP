import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, Upload, History, ZoomIn, X } from 'lucide-react';
import { format } from 'date-fns';

const SYMPTOMS_OPTIONS = [
  'Frequent urination',
  'Increased thirst',
  'Unexplained weight loss',
  'Fatigue',
  'Blurred vision',
  'Slow-healing sores',
  'Frequent infections',
  'Numbness or tingling',
  'Darkened skin'
];

const MEDICATION_OPTIONS = [
  'Metformin',
  'Sulfonylureas',
  'DPP-4 inhibitors',
  'GLP-1 receptor agonists',
  'SGLT2 inhibitors',
  'Insulin - Rapid-acting',
  'Insulin - Long-acting',
  'Thiazolidinediones',
  'Alpha-glucosidase inhibitors'
];

const PatientDashboard = ({ user, onLogout }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    tongue_image: null,
    blood_glucose: '',
    hba1c: '',
    insulin_level: '',
    diabetes_type: '',
    symptoms: [],
    medications: [],
    notes: ''
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API}/submissions`);
      setSubmissions(response.data);
    } catch (error) {
      toast.error('Failed to fetch history');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, tongue_image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleMedicationToggle = (medication) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.includes(medication)
        ? prev.medications.filter(m => m !== medication)
        : [...prev.medications, medication]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tongue_image) {
      toast.error('Please upload a tongue image');
      return;
    }

    setLoading(true);
    const submitData = new FormData();
    submitData.append('tongue_image', formData.tongue_image);
    submitData.append('blood_glucose', formData.blood_glucose);
    submitData.append('hba1c', formData.hba1c);
    submitData.append('insulin_level', formData.insulin_level || '');
    submitData.append('diabetes_type', formData.diabetes_type);
    submitData.append('symptoms', JSON.stringify(formData.symptoms));
    submitData.append('medications', JSON.stringify(formData.medications));
    submitData.append('notes', formData.notes);

    try {
      await axios.post(`${API}/submissions`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Submission saved successfully!');
      
      // Reset form
      setFormData({
        tongue_image: null,
        blood_glucose: '',
        hba1c: '',
        insulin_level: '',
        diabetes_type: '',
        symptoms: [],
        medications: [],
        notes: ''
      });
      setPreviewImage(null);
      
      // Refresh history
      fetchSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen beige-gradient">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur-md border-b-2 border-[#8B7355]/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#5D4E37]">Patient Dashboard</h1>
            <p className="text-sm text-[#8B7355]">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowHistory(true)}
              variant="outline"
              className="border-[#8B7355] text-[#8B7355] hover:bg-[#8B7355] hover:text-white"
              data-testid="view-history-btn"
            >
              <History className="w-4 h-4 mr-2" />
              History
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto border-2 border-[#8B7355]/20 shadow-xl" data-testid="submission-form-card">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-[#5D4E37]">New Submission</CardTitle>
            <CardDescription className="text-[#8B7355]">
              Upload your tongue image and enter your latest diabetes test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="tongue-image" className="text-lg text-[#5D4E37]">Tongue Image *</Label>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Input
                      id="tongue-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                      required
                      data-testid="tongue-image-input"
                    />
                  </div>
                  {previewImage && (
                    <div className="relative w-full max-w-md mx-auto">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="rounded-lg border-2 border-[#8B7355]/30 w-full"
                        data-testid="image-preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Diabetes Data - Grid Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="blood-glucose" className="text-[#5D4E37]">Blood Glucose (mg/dL) *</Label>
                  <Input
                    id="blood-glucose"
                    type="number"
                    step="0.1"
                    placeholder="120.5"
                    value={formData.blood_glucose}
                    onChange={(e) => setFormData({ ...formData, blood_glucose: e.target.value })}
                    required
                    data-testid="blood-glucose-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hba1c" className="text-[#5D4E37]">HbA1c (%) *</Label>
                  <Input
                    id="hba1c"
                    type="number"
                    step="0.1"
                    placeholder="6.5"
                    value={formData.hba1c}
                    onChange={(e) => setFormData({ ...formData, hba1c: e.target.value })}
                    required
                    data-testid="hba1c-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insulin-level" className="text-[#5D4E37]">Insulin Level (optional)</Label>
                  <Input
                    id="insulin-level"
                    type="number"
                    step="0.1"
                    placeholder="15.0"
                    value={formData.insulin_level}
                    onChange={(e) => setFormData({ ...formData, insulin_level: e.target.value })}
                    data-testid="insulin-level-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diabetes-type" className="text-[#5D4E37]">Diabetes Type *</Label>
                  <Select
                    value={formData.diabetes_type}
                    onValueChange={(value) => setFormData({ ...formData, diabetes_type: value })}
                    required
                  >
                    <SelectTrigger data-testid="diabetes-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Type 1">Type 1</SelectItem>
                      <SelectItem value="Type 2">Type 2</SelectItem>
                      <SelectItem value="Prediabetes">Prediabetes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Symptoms - Checkboxes */}
              <div className="space-y-3">
                <Label className="text-lg text-[#5D4E37]">Symptoms</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SYMPTOMS_OPTIONS.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={`symptom-${symptom}`}
                        checked={formData.symptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom)}
                        data-testid={`symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <label
                        htmlFor={`symptom-${symptom}`}
                        className="text-sm text-[#8B7355] cursor-pointer"
                      >
                        {symptom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medications - Checkboxes */}
              <div className="space-y-3">
                <Label className="text-lg text-[#5D4E37]">Current Medications</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {MEDICATION_OPTIONS.map((medication) => (
                    <div key={medication} className="flex items-center space-x-2">
                      <Checkbox
                        id={`medication-${medication}`}
                        checked={formData.medications.includes(medication)}
                        onCheckedChange={() => handleMedicationToggle(medication)}
                        data-testid={`medication-${medication.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <label
                        htmlFor={`medication-${medication}`}
                        className="text-sm text-[#8B7355] cursor-pointer"
                      >
                        {medication}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-[#5D4E37]">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about your condition..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  data-testid="notes-textarea"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#8B7355] hover:bg-[#5D4E37] text-white text-lg py-6"
                disabled={loading}
                data-testid="submit-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-pulse">Saving...</div>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Submit Data
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="history-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-[#5D4E37]">Submission History</DialogTitle>
            <DialogDescription>View all your past submissions with complete details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {submissions.length === 0 ? (
              <p className="text-center text-[#8B7355] py-8">No submissions yet</p>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id} className="border-[#8B7355]/20 card-hover" data-testid="history-submission-card">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
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
                          data-testid="history-tongue-image"
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
                          View Full Size
                        </Button>
                      </div>

                      {/* Data */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-[#8B7355]">Submitted on</p>
                            <p className="font-semibold text-[#5D4E37]">
                              {format(new Date(submission.created_at), 'PPpp')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-[#8B7355]">Blood Glucose</p>
                            <p className="font-semibold text-[#5D4E37]">{submission.blood_glucose} mg/dL</p>
                          </div>
                          <div>
                            <p className="text-sm text-[#8B7355]">HbA1c</p>
                            <p className="font-semibold text-[#5D4E37]">{submission.hba1c}%</p>
                          </div>
                          {submission.insulin_level && (
                            <div>
                              <p className="text-sm text-[#8B7355]">Insulin Level</p>
                              <p className="font-semibold text-[#5D4E37]">{submission.insulin_level}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-[#8B7355]">Diabetes Type</p>
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
                                  className="px-3 py-1 bg-[#8B7355]/10 text-[#5D4E37] rounded-full text-sm"
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
                                  className="px-3 py-1 bg-[#8B7355]/10 text-[#5D4E37] rounded-full text-sm"
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
                            <p className="text-[#5D4E37]">{submission.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog open={imageZoom} onOpenChange={setImageZoom}>
        <DialogContent className="max-w-4xl" data-testid="image-zoom-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-[#5D4E37]">Tongue Image</DialogTitle>
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

export default PatientDashboard;