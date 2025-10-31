#!/usr/bin/env python3

import requests
import json
import sys
import os
import tempfile
from datetime import datetime
from io import BytesIO
from PIL import Image

class SOINHealthcareAPITester:
    def __init__(self, base_url="https://deploy-wizard-35.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.patient_token = None
        self.doctor_token = None
        self.test_patient_id = None
        self.test_doctor_id = None
        self.test_submission_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method, endpoint, data=None, files=None, token=None, expected_status=200):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if files:
            # Remove Content-Type for multipart/form-data
            headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, response.content
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                return False, error_msg

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"

    def create_test_image(self):
        """Create a test image for tongue upload"""
        # Create a simple test image
        img = Image.new('RGB', (200, 200), color='pink')
        img_buffer = BytesIO()
        img.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        return img_buffer

    def test_admin_login(self):
        """Test admin login with default credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, response = self.make_request(
            'POST', 
            'auth/login',
            data={
                "email": "workwithgrover@gmail.com",
                "password": "win40xp"
            }
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            user = response.get('user', {})
            if user.get('role') == 'admin':
                self.log_test("Admin login", True)
                return True
            else:
                self.log_test("Admin login", False, "User role is not admin")
                return False
        else:
            self.log_test("Admin login", False, response)
            return False

    def test_patient_registration(self):
        """Test patient registration (should be auto-approved)"""
        print("\n👤 Testing Patient Registration...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        email = f"patient_test_{timestamp}@test.com"
        
        success, response = self.make_request(
            'POST',
            'auth/register',
            data={
                "email": email,
                "password": "test123",
                "name": f"Test Patient {timestamp}",
                "role": "patient",
                "age": 30
            }
        )
        
        if success and 'access_token' in response:
            self.patient_token = response['access_token']
            user = response.get('user', {})
            self.test_patient_id = user.get('id')
            
            if user.get('role') == 'patient' and user.get('approval_status') == 'approved':
                self.log_test("Patient registration (auto-approved)", True)
                return True
            else:
                self.log_test("Patient registration", False, f"Role: {user.get('role')}, Status: {user.get('approval_status')}")
                return False
        else:
            self.log_test("Patient registration", False, response)
            return False

    def test_doctor_registration(self):
        """Test doctor registration (should be pending approval)"""
        print("\n👨‍⚕️ Testing Doctor Registration...")
        
        timestamp = datetime.now().strftime("%H%M%S")
        email = f"doctor_test_{timestamp}@test.com"
        
        success, response = self.make_request(
            'POST',
            'auth/register',
            data={
                "email": email,
                "password": "test123",
                "name": f"Dr. Test {timestamp}",
                "role": "doctor",
                "age": 35
            }
        )
        
        if success and 'access_token' in response:
            self.doctor_token = response['access_token']
            user = response.get('user', {})
            self.test_doctor_id = user.get('id')
            
            if user.get('role') == 'doctor' and user.get('approval_status') == 'pending':
                self.log_test("Doctor registration (pending approval)", True)
                return True
            else:
                self.log_test("Doctor registration", False, f"Role: {user.get('role')}, Status: {user.get('approval_status')}")
                return False
        else:
            self.log_test("Doctor registration", False, response)
            return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        print("\n📊 Testing Admin Stats...")
        
        if not self.admin_token:
            self.log_test("Admin stats", False, "No admin token available")
            return False
        
        success, response = self.make_request(
            'GET',
            'admin/stats',
            token=self.admin_token
        )
        
        if success:
            required_fields = ['total_patients', 'total_doctors', 'pending_doctors', 'total_submissions']
            if all(field in response for field in required_fields):
                self.log_test("Admin stats", True)
                return True
            else:
                self.log_test("Admin stats", False, f"Missing fields in response: {response}")
                return False
        else:
            self.log_test("Admin stats", False, response)
            return False

    def test_pending_doctors(self):
        """Test getting pending doctors"""
        print("\n⏳ Testing Pending Doctors List...")
        
        if not self.admin_token:
            self.log_test("Pending doctors list", False, "No admin token available")
            return False
        
        success, response = self.make_request(
            'GET',
            'admin/pending-doctors',
            token=self.admin_token
        )
        
        if success:
            if isinstance(response, list):
                self.log_test("Pending doctors list", True)
                return True
            else:
                self.log_test("Pending doctors list", False, f"Expected list, got: {type(response)}")
                return False
        else:
            self.log_test("Pending doctors list", False, response)
            return False

    def test_doctor_approval(self):
        """Test doctor approval workflow"""
        print("\n✅ Testing Doctor Approval...")
        
        if not self.admin_token or not self.test_doctor_id:
            self.log_test("Doctor approval", False, "No admin token or doctor ID available")
            return False
        
        success, response = self.make_request(
            'POST',
            f'admin/approve-doctor/{self.test_doctor_id}?approve=true',
            token=self.admin_token
        )
        
        if success:
            self.log_test("Doctor approval", True)
            return True
        else:
            self.log_test("Doctor approval", False, response)
            return False

    def test_patient_submission(self):
        """Test patient submission creation"""
        print("\n📝 Testing Patient Submission...")
        
        if not self.patient_token:
            self.log_test("Patient submission", False, "No patient token available")
            return False
        
        # Create test image
        test_image = self.create_test_image()
        
        # Prepare form data
        form_data = {
            'blood_glucose': '120.5',
            'hba1c': '6.5',
            'insulin_level': '15.0',
            'diabetes_type': 'Type 2',
            'symptoms': json.dumps(['Fatigue', 'Increased thirst']),
            'medications': json.dumps(['Metformin', 'Insulin - Long-acting']),
            'notes': 'Test submission notes'
        }
        
        files = {
            'tongue_image': ('test_tongue.jpg', test_image, 'image/jpeg')
        }
        
        success, response = self.make_request(
            'POST',
            'submissions',
            data=form_data,
            files=files,
            token=self.patient_token,
            expected_status=200
        )
        
        if success and 'id' in response:
            self.test_submission_id = response['id']
            self.log_test("Patient submission", True)
            return True
        else:
            self.log_test("Patient submission", False, response)
            return False

    def test_patient_view_submissions(self):
        """Test patient viewing their own submissions"""
        print("\n👁️ Testing Patient View Submissions...")
        
        if not self.patient_token:
            self.log_test("Patient view submissions", False, "No patient token available")
            return False
        
        success, response = self.make_request(
            'GET',
            'submissions',
            token=self.patient_token
        )
        
        if success and isinstance(response, list):
            self.log_test("Patient view submissions", True)
            return True
        else:
            self.log_test("Patient view submissions", False, response)
            return False

    def test_doctor_view_submissions(self):
        """Test doctor viewing all submissions (after approval)"""
        print("\n👨‍⚕️ Testing Doctor View Submissions...")
        
        if not self.doctor_token:
            self.log_test("Doctor view submissions", False, "No doctor token available")
            return False
        
        success, response = self.make_request(
            'GET',
            'submissions',
            token=self.doctor_token
        )
        
        if success and isinstance(response, list):
            self.log_test("Doctor view submissions", True)
            return True
        else:
            self.log_test("Doctor view submissions", False, response)
            return False

    def test_image_serving(self):
        """Test image serving endpoint"""
        print("\n🖼️ Testing Image Serving...")
        
        if not self.test_submission_id:
            self.log_test("Image serving", False, "No submission ID available")
            return False
        
        # First get submission to get image URL
        success, submission = self.make_request(
            'GET',
            'submissions',
            token=self.patient_token
        )
        
        if success and submission:
            # Find our test submission
            test_sub = None
            for sub in submission:
                if sub.get('id') == self.test_submission_id:
                    test_sub = sub
                    break
            
            if test_sub and 'tongue_image_url' in test_sub:
                # Extract filename from URL
                image_url = test_sub['tongue_image_url']
                filename = image_url.split('/')[-1]
                
                # Test image endpoint
                success, response = self.make_request(
                    'GET',
                    f'images/{filename}',
                    expected_status=200
                )
                
                if success:
                    self.log_test("Image serving", True)
                    return True
                else:
                    self.log_test("Image serving", False, response)
                    return False
            else:
                self.log_test("Image serving", False, "No image URL in submission")
                return False
        else:
            self.log_test("Image serving", False, "Could not get submissions")
            return False

    def test_export_data(self):
        """Test admin data export"""
        print("\n📦 Testing Data Export...")
        
        if not self.admin_token:
            self.log_test("Data export", False, "No admin token available")
            return False
        
        success, response = self.make_request(
            'GET',
            'admin/export-data',
            token=self.admin_token,
            expected_status=200
        )
        
        if success:
            self.log_test("Data export", True)
            return True
        else:
            self.log_test("Data export", False, response)
            return False

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("\n🚫 Testing Unauthorized Access...")
        
        # Test accessing admin endpoint without token
        success, response = self.make_request(
            'GET',
            'admin/stats',
            expected_status=401
        )
        
        if not success and "401" in str(response):
            self.log_test("Unauthorized access protection", True)
            return True
        else:
            self.log_test("Unauthorized access protection", False, f"Expected 401, got different response: {response}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🏥 Starting SOIN Healthcare API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Authentication tests
        self.test_admin_login()
        self.test_patient_registration()
        self.test_doctor_registration()
        
        # Admin functionality tests
        self.test_admin_stats()
        self.test_pending_doctors()
        self.test_doctor_approval()
        
        # Submission tests
        self.test_patient_submission()
        self.test_patient_view_submissions()
        self.test_doctor_view_submissions()
        self.test_image_serving()
        
        # Export test
        self.test_export_data()
        
        # Security test
        self.test_unauthorized_access()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SOINHealthcareAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())