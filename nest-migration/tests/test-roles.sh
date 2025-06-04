#!/bin/bash

# Test script to verify role-based authentication
# Run this after executing the SQL script to add roles

echo "🧪 Testing Role-Based Authentication"
echo "====================================="

BASE_URL="http://localhost:5050/api"

# Test 1: Login with lab user (milton)
echo "📝 Test 1: Lab User Login"
LAB_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"milton@ingeocimyc.com","password":"your_password_here"}')

if echo "$LAB_RESPONSE" | grep -q "accessToken"; then
  echo "✅ Lab user login successful"
  LAB_TOKEN=$(echo "$LAB_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "❌ Lab user login failed"
  echo "$LAB_RESPONSE"
  exit 1
fi

# Test 2: Login with admin user (eider)
echo "📝 Test 2: Admin User Login"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"eider@ingeocimyc.com","password":"your_password_here"}')

if echo "$ADMIN_RESPONSE" | grep -q "accessToken"; then
  echo "✅ Admin user login successful"
  ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "❌ Admin user login failed"
  echo "$ADMIN_RESPONSE"
  exit 1
fi

# Test 3: Lab user accessing lab endpoints
echo "📝 Test 3: Lab User Accessing Lab Endpoints"
LAB_ACCESS=$(curl -s -X GET "$BASE_URL/lab/apiques/project/1" \
  -H "Authorization: Bearer $LAB_TOKEN")

if echo "$LAB_ACCESS" | grep -q "error"; then
  echo "❌ Lab user cannot access lab endpoints"
  echo "$LAB_ACCESS"
else
  echo "✅ Lab user can access lab endpoints"
fi

# Test 4: Admin user accessing project management
echo "📝 Test 4: Admin User Accessing Project Management"
ADMIN_ACCESS=$(curl -s -X GET "$BASE_URL/project-management/projects" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$ADMIN_ACCESS" | grep -q "error"; then
  echo "❌ Admin user cannot access project management"
  echo "$ADMIN_ACCESS"
else
  echo "✅ Admin user can access project management"
fi

# Test 5: Lab user trying to access admin-only endpoints (should fail)
echo "📝 Test 5: Lab User Accessing Admin-Only Endpoints (Should Fail)"
LAB_ADMIN_ACCESS=$(curl -s -X GET "$BASE_URL/project-management/projects" \
  -H "Authorization: Bearer $LAB_TOKEN")

if echo "$LAB_ADMIN_ACCESS" | grep -q "Forbidden\|403"; then
  echo "✅ Lab user correctly denied access to admin endpoints"
else
  echo "❌ Lab user incorrectly allowed access to admin endpoints"
  echo "$LAB_ADMIN_ACCESS"
fi

echo ""
echo "🎉 Role testing completed!"
echo "Note: Update the passwords in this script with actual user passwords"
