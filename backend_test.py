#!/usr/bin/env python3
"""
Backend API Testing for RankdSEO Admin Panel
Focus: Image Upload API Endpoint Testing
"""

import requests
import json
import os
import tempfile
from io import BytesIO
from PIL import Image
import time

# Configuration
BASE_URL = "https://backlink-hub-1.preview.emergentagent.com"
UPLOAD_ENDPOINT = f"{BASE_URL}/api/upload"

def create_test_image(width=100, height=100, format='JPEG'):
    """Create a test image in memory"""
    img = Image.new('RGB', (width, height), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format=format)
    img_bytes.seek(0)
    return img_bytes

def create_large_test_image():
    """Create a large test image (over 10MB)"""
    # Create a large image that will be over 10MB
    # Using a very large image with high quality to exceed 10MB
    img = Image.new('RGB', (5000, 5000), color='blue')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG', quality=100)
    img_bytes.seek(0)
    return img_bytes

def create_text_file():
    """Create a test text file"""
    text_content = "This is a test text file, not an image."
    text_bytes = BytesIO(text_content.encode('utf-8'))
    return text_bytes

def test_successful_image_upload():
    """Test Case 1: Successful image upload"""
    print("\n=== Test Case 1: Successful Image Upload ===")
    
    try:
        # Create a test image
        test_image = create_test_image()
        
        # Prepare the file for upload
        files = {
            'file': ('test_image.jpg', test_image, 'image/jpeg')
        }
        
        # Make the request
        response = requests.post(UPLOAD_ENDPOINT, files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Verify response
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            if data.get('success') == True:
                print("✅ PASS - Response contains success: true")
            else:
                print("❌ FAIL - Response missing success: true")
                return False
                
            if 'url' in data and data['url'].startswith('/screenshots/'):
                print(f"✅ PASS - Response contains valid URL: {data['url']}")
            else:
                print("❌ FAIL - Response missing valid URL starting with /screenshots/")
                return False
                
            if 'filename' in data and data['filename']:
                print(f"✅ PASS - Response contains filename: {data['filename']}")
            else:
                print("❌ FAIL - Response missing filename")
                return False
                
            print("✅ PASS - Successful image upload test completed")
            return True
        else:
            print(f"❌ FAIL - Expected status 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception during successful upload test: {str(e)}")
        return False

def test_reject_non_image_files():
    """Test Case 2: Reject non-image files"""
    print("\n=== Test Case 2: Reject Non-Image Files ===")
    
    try:
        # Create a text file
        text_file = create_text_file()
        
        # Prepare the file for upload
        files = {
            'file': ('test_file.txt', text_file, 'text/plain')
        }
        
        # Make the request
        response = requests.post(UPLOAD_ENDPOINT, files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Verify response
        if response.status_code == 400:
            data = response.json()
            
            if 'error' in data and 'image' in data['error'].lower():
                print("✅ PASS - Correctly rejected non-image file with appropriate error message")
                return True
            else:
                print("❌ FAIL - Error message doesn't mention image requirement")
                return False
        else:
            print(f"❌ FAIL - Expected status 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception during non-image rejection test: {str(e)}")
        return False

def test_reject_missing_file():
    """Test Case 3: Reject missing file"""
    print("\n=== Test Case 3: Reject Missing File ===")
    
    try:
        # Make request with multipart form but without the 'file' field
        files = {
            'notfile': ('test.txt', BytesIO(b'test'), 'text/plain')
        }
        response = requests.post(UPLOAD_ENDPOINT, files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Verify response
        if response.status_code == 400:
            data = response.json()
            
            if 'error' in data and ('no file' in data['error'].lower() or 'file' in data['error'].lower()):
                print("✅ PASS - Correctly rejected request with no file")
                return True
            else:
                print("❌ FAIL - Error message doesn't mention missing file")
                return False
        else:
            print(f"❌ FAIL - Expected status 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception during missing file test: {str(e)}")
        return False

def test_file_size_validation():
    """Test Case 4: File size validation (10MB limit)"""
    print("\n=== Test Case 4: File Size Validation ===")
    
    try:
        # Create a large image (this might be over 10MB)
        large_image = create_large_test_image()
        
        # Check the size
        large_image.seek(0, 2)  # Seek to end
        file_size = large_image.tell()
        large_image.seek(0)  # Reset to beginning
        
        print(f"Test image size: {file_size / (1024*1024):.2f} MB")
        
        if file_size <= 10 * 1024 * 1024:
            print("⚠️ SKIP - Test image is not large enough to test 10MB limit")
            return True
        
        # Prepare the file for upload
        files = {
            'file': ('large_image.jpg', large_image, 'image/jpeg')
        }
        
        # Make the request
        response = requests.post(UPLOAD_ENDPOINT, files=files, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Verify response
        if response.status_code == 400:
            data = response.json()
            
            if 'error' in data and ('10mb' in data['error'].lower() or 'size' in data['error'].lower()):
                print("✅ PASS - Correctly rejected large file with size error")
                return True
            else:
                print("❌ FAIL - Error message doesn't mention file size limit")
                return False
        else:
            print(f"❌ FAIL - Expected status 400 for large file, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception during file size test: {str(e)}")
        return False

def test_different_image_formats():
    """Test Case 5: Different image formats"""
    print("\n=== Test Case 5: Different Image Formats ===")
    
    formats = [
        ('PNG', 'image/png', 'test.png'),
        ('JPEG', 'image/jpeg', 'test.jpg'),
        ('GIF', 'image/gif', 'test.gif'),
        ('WEBP', 'image/webp', 'test.webp')
    ]
    
    all_passed = True
    
    for format_name, mime_type, filename in formats:
        try:
            print(f"\n--- Testing {format_name} format ---")
            
            # Create test image in specific format
            if format_name == 'GIF':
                # GIF needs special handling
                img = Image.new('P', (100, 100), color=1)
                img.putpalette([255,0,0] + [0,0,0]*255)  # Red palette
            else:
                img = Image.new('RGB', (100, 100), color='green')
            
            img_bytes = BytesIO()
            img.save(img_bytes, format=format_name)
            img_bytes.seek(0)
            
            # Prepare the file for upload
            files = {
                'file': (filename, img_bytes, mime_type)
            }
            
            # Make the request
            response = requests.post(UPLOAD_ENDPOINT, files=files, timeout=30)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') == True and 'url' in data:
                    print(f"✅ PASS - {format_name} format accepted")
                else:
                    print(f"❌ FAIL - {format_name} format response invalid")
                    all_passed = False
            else:
                print(f"❌ FAIL - {format_name} format rejected with status {response.status_code}")
                all_passed = False
                
        except Exception as e:
            print(f"❌ FAIL - Exception testing {format_name}: {str(e)}")
            all_passed = False
    
    return all_passed

def run_all_tests():
    """Run all upload API tests"""
    print("🚀 Starting Image Upload API Testing")
    print("=" * 50)
    
    test_results = []
    
    # Run all test cases
    test_results.append(("Successful Image Upload", test_successful_image_upload()))
    test_results.append(("Reject Non-Image Files", test_reject_non_image_files()))
    test_results.append(("Reject Missing File", test_reject_missing_file()))
    test_results.append(("File Size Validation", test_file_size_validation()))
    test_results.append(("Different Image Formats", test_different_image_formats()))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Image Upload API is working correctly!")
        return True
    else:
        print("⚠️ SOME TESTS FAILED - Image Upload API has issues")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)