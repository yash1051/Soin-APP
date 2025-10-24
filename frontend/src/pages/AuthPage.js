import { useState } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';

const AuthPage = ({ setUser }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'patient',
    age: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      localStorage.setItem('token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      setUser(response.data.user);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...registerData,
        age: registerData.age ? parseInt(registerData.age) : null
      };

      const response = await axios.post(`${API}/auth/register`, payload);
      localStorage.setItem('token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      setUser(response.data.user);

      if (registerData.role === 'doctor') {
        toast.info('Registration successful! Your account is pending admin approval.');
      } else {
        toast.success('Registration successful!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen beige-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-16 h-16 bg-[#8B7355] rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-serif font-bold text-[#5D4E37]">SOIN</h1>
          </div>
          <p className="text-2xl font-serif text-[#8B7355]">
            Smart Oral & Integrated Nursing
          </p>
          <p className="text-lg text-[#8B7355] leading-relaxed">
            A comprehensive healthcare platform for tongue image analysis and diabetes data management. 
            Connecting patients and doctors for better health outcomes.
          </p>
          <div className="space-y-3 text-left pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#8B7355] rounded-full mt-2"></div>
              <p className="text-[#8B7355]"><span className="font-semibold">Patients:</span> Upload tongue images and diabetes reports with one click</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#8B7355] rounded-full mt-2"></div>
              <p className="text-[#8B7355]"><span className="font-semibold">Doctors:</span> Review and analyze patient data with historical tracking</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#8B7355] rounded-full mt-2"></div>
              <p className="text-[#8B7355]"><span className="font-semibold">Admin:</span> Full access control and data export capabilities</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <Card className="border-2 border-[#8B7355]/20 shadow-2xl" data-testid="auth-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-serif text-[#5D4E37]">Welcome</CardTitle>
            <CardDescription className="text-[#8B7355]">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#8B7355] hover:bg-[#5D4E37] text-white"
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      data-testid="register-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      data-testid="register-password-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-age">Age</Label>
                    <Input
                      id="register-age"
                      type="number"
                      placeholder="25"
                      value={registerData.age}
                      onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                      data-testid="register-age-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role">I am a...</Label>
                    <Select
                      value={registerData.role}
                      onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                    >
                      <SelectTrigger data-testid="register-role-select">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient" data-testid="role-patient-option">Patient</SelectItem>
                        <SelectItem value="doctor" data-testid="role-doctor-option">Doctor (Requires Approval)</SelectItem>
                      </SelectContent>
                    </Select>
                    {registerData.role === 'doctor' && (
                      <p className="text-sm text-[#8B7355] italic">
                        Doctor accounts require admin approval before access is granted.
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#8B7355] hover:bg-[#5D4E37] text-white"
                    disabled={loading}
                    data-testid="register-submit-btn"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;