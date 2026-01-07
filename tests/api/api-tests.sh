#!/bin/bash
# Home Staff 360 v2.0 - API Test Suite
# 
# Tests critical API endpoints with HTTP status code validation
# Run with: bash tests/api/api-tests.sh
#
# Prerequisites: Application running on localhost:5000
# Results: tests/api/test-results.log

BASE_URL="${API_URL:-http://localhost:5000}"
LOG_FILE="tests/api/test-results.log"
PASS_COUNT=0
FAIL_COUNT=0

mkdir -p tests/api
echo "Home Staff 360 v2.0 - API Test Results" > $LOG_FILE
echo "Execution Date: $(date)" >> $LOG_FILE
echo "Base URL: $BASE_URL" >> $LOG_FILE
echo "---" >> $LOG_FILE

log_test() {
    local status=$1
    local test_id=$2
    local expected=$3
    local actual=$4
    
    if [ "$status" = "PASS" ]; then
        ((PASS_COUNT++))
        echo "$test_id: PASS (HTTP $actual)" | tee -a $LOG_FILE
    else
        ((FAIL_COUNT++))
        echo "$test_id: FAIL - Expected $expected, got $actual" | tee -a $LOG_FILE
    fi
}

echo "=== HOME STAFF 360 v2.0 - API TEST SUITE ===" | tee -a $LOG_FILE
echo "Testing: $BASE_URL" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# ============ AUTHENTICATION TESTS ============
echo "=== AUTHENTICATION TESTS ===" | tee -a $LOG_FILE

# TC001: Valid phone check - 200
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/check-phone" -H "Content-Type: application/json" -d '{"phone": "+919876543210"}')
[ "$CODE" = "200" ] && log_test "PASS" "TC001-ValidPhone" "200" "$CODE" || log_test "FAIL" "TC001-ValidPhone" "200" "$CODE"

# TC002: Empty phone - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/check-phone" -H "Content-Type: application/json" -d '{"phone": ""}')
[ "$CODE" = "400" ] && log_test "PASS" "TC002-EmptyPhone" "400" "$CODE" || log_test "FAIL" "TC002-EmptyPhone" "400" "$CODE"

# TC003: Invalid phone - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/check-phone" -H "Content-Type: application/json" -d '{"phone": "123"}')
[ "$CODE" = "400" ] && log_test "PASS" "TC003-InvalidPhone" "400" "$CODE" || log_test "FAIL" "TC003-InvalidPhone" "400" "$CODE"

# TC004: Missing phone - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/check-phone" -H "Content-Type: application/json" -d '{}')
[ "$CODE" = "400" ] && log_test "PASS" "TC004-MissingPhone" "400" "$CODE" || log_test "FAIL" "TC004-MissingPhone" "400" "$CODE"

# TC016: OTP request - 200
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/request-otp" -H "Content-Type: application/json" -d '{"phone": "+919876540020"}')
[ "$CODE" = "200" ] && log_test "PASS" "TC016-OTPRequest" "200" "$CODE" || log_test "FAIL" "TC016-OTPRequest" "200" "$CODE"

# TC019: OTP no phone - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/request-otp" -H "Content-Type: application/json" -d '{}')
[ "$CODE" = "400" ] && log_test "PASS" "TC019-OTPNoPhone" "400" "$CODE" || log_test "FAIL" "TC019-OTPNoPhone" "400" "$CODE"

# TC021: Verify empty - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/verify-otp" -H "Content-Type: application/json" -d '{}')
[ "$CODE" = "400" ] && log_test "PASS" "TC021-VerifyEmpty" "400" "$CODE" || log_test "FAIL" "TC021-VerifyEmpty" "400" "$CODE"

# TC072: Empty login - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{}')
[ "$CODE" = "400" ] && log_test "PASS" "TC072-EmptyLogin" "400" "$CODE" || log_test "FAIL" "TC072-EmptyLogin" "400" "$CODE"

# TC076: Forgot password empty - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/forgot-password" -H "Content-Type: application/json" -d '{"phone": ""}')
[ "$CODE" = "400" ] && log_test "PASS" "TC076-ForgotEmpty" "400" "$CODE" || log_test "FAIL" "TC076-ForgotEmpty" "400" "$CODE"

# TC078: Reset password empty - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/reset-password" -H "Content-Type: application/json" -d '{}')
[ "$CODE" = "400" ] && log_test "PASS" "TC078-ResetEmpty" "400" "$CODE" || log_test "FAIL" "TC078-ResetEmpty" "400" "$CODE"

echo "" | tee -a $LOG_FILE

# ============ AUTHORIZATION TESTS ============
echo "=== AUTHORIZATION TESTS (Protected Endpoints) ===" | tee -a $LOG_FILE

# TC092: Profile no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/user/profile")
[ "$CODE" = "401" ] && log_test "PASS" "TC092-ProfileNoAuth" "401" "$CODE" || log_test "FAIL" "TC092-ProfileNoAuth" "401" "$CODE"

# TC136: Connections no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/connections")
[ "$CODE" = "401" ] && log_test "PASS" "TC136-ConnNoAuth" "401" "$CODE" || log_test "FAIL" "TC136-ConnNoAuth" "401" "$CODE"

# TC212: Notifications no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/notifications")
[ "$CODE" = "401" ] && log_test "PASS" "TC212-NotifNoAuth" "401" "$CODE" || log_test "FAIL" "TC212-NotifNoAuth" "401" "$CODE"

# TC302: Spaces no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/shared-spaces")
[ "$CODE" = "401" ] && log_test "PASS" "TC302-SpacesNoAuth" "401" "$CODE" || log_test "FAIL" "TC302-SpacesNoAuth" "401" "$CODE"

# TC402: Chats no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/chats")
[ "$CODE" = "401" ] && log_test "PASS" "TC402-ChatsNoAuth" "401" "$CODE" || log_test "FAIL" "TC402-ChatsNoAuth" "401" "$CODE"

# TC461: Sync no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/sync/status")
[ "$CODE" = "401" ] && log_test "PASS" "TC461-SyncNoAuth" "401" "$CODE" || log_test "FAIL" "TC461-SyncNoAuth" "401" "$CODE"

# TC502: Bindings no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/bindings")
[ "$CODE" = "401" ] && log_test "PASS" "TC502-BindNoAuth" "401" "$CODE" || log_test "FAIL" "TC502-BindNoAuth" "401" "$CODE"

echo "" | tee -a $LOG_FILE

# ============ ADMIN TESTS ============
echo "=== ADMIN TESTS ===" | tee -a $LOG_FILE

# TC1203: Admin bad login - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/admin/login" -H "Content-Type: application/json" -d '{"email": "test@test.com", "password": "wrong"}')
[ "$CODE" = "401" ] && log_test "PASS" "TC1203-AdminBadLogin" "401" "$CODE" || log_test "FAIL" "TC1203-AdminBadLogin" "401" "$CODE"

# TC1205: Admin empty login - 400
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/admin/login" -H "Content-Type: application/json" -d '{}')
[ "$CODE" = "400" ] && log_test "PASS" "TC1205-AdminEmptyLogin" "400" "$CODE" || log_test "FAIL" "TC1205-AdminEmptyLogin" "400" "$CODE"

# TC1237: Admin stats no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/stats")
[ "$CODE" = "401" ] && log_test "PASS" "TC1237-AdminStatsNoAuth" "401" "$CODE" || log_test "FAIL" "TC1237-AdminStatsNoAuth" "401" "$CODE"

# TC1241: Admin users no auth - 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/users")
[ "$CODE" = "401" ] && log_test "PASS" "TC1241-AdminUsersNoAuth" "401" "$CODE" || log_test "FAIL" "TC1241-AdminUsersNoAuth" "401" "$CODE"

echo "" | tee -a $LOG_FILE

# ============ RESULTS ============
echo "==========================================" | tee -a $LOG_FILE
echo "FINAL RESULTS" | tee -a $LOG_FILE
echo "==========================================" | tee -a $LOG_FILE
echo "PASSED: $PASS_COUNT" | tee -a $LOG_FILE
echo "FAILED: $FAIL_COUNT" | tee -a $LOG_FILE
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "TOTAL:  $TOTAL" | tee -a $LOG_FILE
RATE=$(awk "BEGIN {printf \"%.1f\", $PASS_COUNT * 100 / $TOTAL}")
echo "SUCCESS RATE: ${RATE}%" | tee -a $LOG_FILE

echo "" | tee -a $LOG_FILE
if [ $FAIL_COUNT -eq 0 ]; then
    echo "ALL TESTS PASSED!" | tee -a $LOG_FILE
    exit 0
else
    echo "Some tests failed." | tee -a $LOG_FILE
    exit 1
fi
