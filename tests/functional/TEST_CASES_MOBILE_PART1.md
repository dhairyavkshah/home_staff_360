# Home Staff 360 - Functional Test Cases (Mobile App)

## Part 1: Authentication, Onboarding, Profile & Settings (TC001-TC190)

---

## Section 1: Authentication & Onboarding (TC001-TC090)

### 1.1 Phone Number Entry (TC001-TC015)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC001 | Valid Phone Entry - 10 Digits | Enter valid 10-digit phone number in registration | App installed, on login screen | Phone accepted, OTP request button enabled | Pass |
| TC002 | Valid Phone Entry - With Country Code | Enter phone with +91 country code | App on login screen | Country code parsed, phone accepted | Pass |
| TC003 | Invalid Phone - Less Than 10 Digits | Enter 9-digit phone number | App on login screen | Error: "Enter valid 10-digit phone number" | Pass |
| TC004 | Invalid Phone - More Than 10 Digits | Enter 11-digit phone number | App on login screen | Error: "Enter valid 10-digit phone number" | Pass |
| TC005 | Invalid Phone - Letters Included | Enter phone with alphabetic characters | App on login screen | Input rejected, only numbers allowed | Pass |
| TC006 | Invalid Phone - Special Characters | Enter phone with special characters (!@#) | App on login screen | Input rejected, only numbers allowed | Pass |
| TC007 | Phone Field - Empty Submission | Click submit without entering phone | App on login screen | Error: "Phone number is required" | Pass |
| TC008 | Phone Field - Leading Zeros | Enter phone starting with 0 | App on login screen | Phone formatted correctly | Pass |
| TC009 | Phone Field - Auto-format | Enter phone, verify auto-spacing | App on login screen | Phone displayed with proper formatting | Pass |
| TC010 | Country Code Selector - Open | Tap country code dropdown | App on login screen | Country list displayed | Pass |
| TC011 | Country Code Selector - Search | Search for country by name | Country selector open | Matching countries filtered | Pass |
| TC012 | Country Code Selector - Select India | Select India (+91) | Country selector open | +91 selected, flag updated | Pass |
| TC013 | Country Code Selector - Select USA | Select United States (+1) | Country selector open | +1 selected, flag updated | Pass |
| TC014 | Phone Auto-Detection | Allow phone state permission | Fresh app install | Phone auto-populated if available | Pass |
| TC015 | Phone Field - Paste Number | Paste phone from clipboard | App on login screen | Phone parsed and validated | Pass |

### 1.2 OTP Request (TC016-TC030)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC016 | OTP Request - Success | Request OTP for valid new phone | Valid phone entered | OTP sent, success message shown | Pass |
| TC017 | OTP Request - Existing User | Request OTP for registered phone | Registered user phone entered | OTP sent for login | Pass |
| TC018 | OTP Request - Loading State | Check loading indicator during request | OTP request in progress | Loading spinner visible | Pass |
| TC019 | OTP Request - Network Error | Request OTP without internet | Phone entered, no network | Error: "Network error. Please try again" | Pass |
| TC020 | OTP Request - Server Error | Request when server unavailable | Phone entered, server down | Error: "Server unavailable" | Pass |
| TC021 | OTP Request - Rate Limiting | Request 6 OTPs in 10 minutes | 5 OTPs already sent | Error: "Too many requests. Wait 10 minutes" | Pass |
| TC022 | OTP Resend - Timer Display | Check resend timer after OTP sent | OTP screen displayed | 60-second countdown shown | Pass |
| TC023 | OTP Resend - Button Disabled | Try resend before timer expires | Timer counting down | Resend button disabled | Pass |
| TC024 | OTP Resend - Success | Resend OTP after timer expires | Timer at 0 | New OTP sent successfully | Pass |
| TC025 | OTP Request - Twilio Integration | Verify SMS delivery via Twilio | Valid phone, Twilio configured | SMS received on phone | Pass |
| TC026 | OTP Format - 6 Digits | Verify OTP is 6-digit numeric | OTP sent | 6-digit OTP received | Pass |
| TC027 | OTP Request - Multiple Phones | Request OTP for different phones | Previous OTP pending | New OTP sent to new phone | Pass |
| TC028 | OTP Expiry Notice | Display OTP expiry information | OTP screen shown | "OTP expires in 10 minutes" displayed | Pass |
| TC029 | OTP Request - Back Navigation | Go back from OTP screen | On OTP entry screen | Returns to phone entry | Pass |
| TC030 | OTP Request - Help Link | Tap "Didn't receive OTP?" | OTP screen displayed | Help options shown | Pass |

### 1.3 OTP Verification (TC031-TC050)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC031 | OTP Verify - Correct Code | Enter correct 6-digit OTP | Valid OTP received | Verification successful | Pass |
| TC032 | OTP Verify - Auto-Submit | OTP auto-submits on 6th digit | Entering OTP | Auto-verification triggered | Pass |
| TC033 | OTP Verify - Wrong Code | Enter incorrect OTP | OTP sent | Error: "Invalid OTP" | Pass |
| TC034 | OTP Verify - Expired Code | Enter OTP after 10 minutes | OTP expired | Error: "OTP expired. Request new one" | Pass |
| TC035 | OTP Verify - Max Attempts | Fail 5 verification attempts | 4 failed attempts | Account locked for 30 minutes | Pass |
| TC036 | OTP Field - Auto-Focus | Verify auto-focus on OTP input | OTP screen opened | First digit field focused | Pass |
| TC037 | OTP Field - Auto-Advance | Entering digit moves to next | Typing OTP | Cursor advances automatically | Pass |
| TC038 | OTP Field - Backspace | Delete digit with backspace | OTP partially entered | Previous field focused | Pass |
| TC039 | OTP Field - Clear All | Clear entire OTP entry | OTP entered | All fields cleared | Pass |
| TC040 | OTP Paste - Full Code | Paste 6-digit OTP | OTP copied to clipboard | All fields populated | Pass |
| TC041 | OTP Paste - Partial Code | Paste 3-digit partial | 3 digits in clipboard | Only 3 fields filled | Pass |
| TC042 | OTP Field - Non-Numeric | Enter letter in OTP field | On OTP screen | Input rejected | Pass |
| TC043 | OTP Verify - Loading State | Check loading during verification | OTP submitted | Loading indicator shown | Pass |
| TC044 | OTP Verify - Network Failure | Verify with no internet | OTP entered, offline | Error: "Network error" | Pass |
| TC045 | OTP Screen - Timer Visible | Countdown timer displayed | On OTP screen | Timer counting down from 60s | Pass |
| TC046 | OTP Auto-Read - SMS | Auto-read OTP from SMS (Android) | SMS permission granted | OTP auto-populated | Pass |
| TC047 | OTP Keyboard - Numeric Only | Verify numeric keyboard shown | OTP field focused | Number pad displayed | Pass |
| TC048 | OTP Verify - Haptic Feedback | Haptic on successful verify | OTP correct | Device vibrates briefly | Pass |
| TC049 | OTP Verify - Error Haptic | Haptic on failed verify | OTP incorrect | Error vibration pattern | Pass |
| TC050 | OTP Attempts Counter | Display remaining attempts | 2 failed attempts | "3 attempts remaining" shown | Pass |

### 1.4 Password Setup (TC051-TC065)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC051 | Password Create - Valid | Create password with 6+ chars | New user, OTP verified | Password saved successfully | Pass |
| TC052 | Password Create - Too Short | Enter 5-character password | Password setup screen | Error: "Minimum 6 characters" | Pass |
| TC053 | Password Create - Strong | Enter password with mixed chars | Password setup screen | Strength indicator: Strong | Pass |
| TC054 | Password Create - Weak | Enter simple password (123456) | Password setup screen | Strength indicator: Weak (allowed) | Pass |
| TC055 | Password Confirm - Match | Confirm password matches | Password entered | Passwords match, continue enabled | Pass |
| TC056 | Password Confirm - Mismatch | Confirm password different | Password entered | Error: "Passwords don't match" | Pass |
| TC057 | Password Toggle - Show | Tap show password icon | Password entered | Password visible as text | Pass |
| TC058 | Password Toggle - Hide | Tap hide password icon | Password visible | Password hidden as dots | Pass |
| TC059 | Password Field - Empty | Submit without password | Password screen | Error: "Password required" | Pass |
| TC060 | Password Field - Spaces | Enter password with spaces | Password screen | Spaces allowed in password | Pass |
| TC061 | Password Field - Special Chars | Password with !@#$%^&* | Password screen | Special characters accepted | Pass |
| TC062 | Password Field - Unicode | Password with non-ASCII chars | Password screen | Unicode characters accepted | Pass |
| TC063 | Password Save - Loading | Check loading on save | Submitting password | Loading indicator shown | Pass |
| TC064 | Password Save - Success | Password saved successfully | Valid password entered | Success, navigate to profile | Pass |
| TC065 | Password Save - Error | Server error during save | Valid password, server issue | Error displayed, retry option | Pass |

### 1.5 Login Flow (TC066-TC085)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC066 | Login - Valid Credentials | Login with phone and password | Registered user | Login successful, home shown | Pass |
| TC067 | Login - Wrong Password | Enter incorrect password | Registered user | Error: "Invalid password" | Pass |
| TC068 | Login - Unregistered Phone | Login with new phone | Phone not registered | Redirected to registration | Pass |
| TC069 | Login - Case Sensitivity | Password case sensitivity check | Password: "Pass123" | Case-sensitive validation | Pass |
| TC070 | Login - Remember Me | Enable "Remember Me" option | Login screen | Session persisted longer | Pass |
| TC071 | Login - Loading State | Check loading during login | Credentials submitted | Loading spinner shown | Pass |
| TC072 | Login - Network Error | Login without internet | Valid credentials, offline | Error: "Network error" | Pass |
| TC073 | Login - Session Token | Verify JWT token created | Successful login | Token stored securely | Pass |
| TC074 | Login - Token Expiry | Token expires after 30 days | Logged in 31 days ago | Redirected to login | Pass |
| TC075 | Login - Concurrent Sessions | Login from second device | Already logged in elsewhere | Both sessions valid | Pass |
| TC076 | Login - Auto-Login | App reopened after login | Recently logged in | Auto-authenticated | Pass |
| TC077 | Login - Biometric Prompt | Biometric login offered | Biometric enabled | Fingerprint/Face ID prompt | Pass |
| TC078 | Login - Biometric Success | Authenticate with biometric | Biometric registered | Login successful | Pass |
| TC079 | Login - Biometric Fail | Biometric not recognized | Wrong fingerprint | Fallback to password | Pass |
| TC080 | Login - PIN Option | Login with PIN code | PIN set up | PIN entry screen shown | Pass |
| TC081 | Login - PIN Success | Enter correct PIN | Valid PIN | Login successful | Pass |
| TC082 | Login - PIN Failure | Enter wrong PIN 3 times | Wrong PIN | Locked, password required | Pass |
| TC083 | Login - Account Locked | Login after max failed attempts | Account locked | Error: "Account locked. Wait 30 min" | Pass |
| TC084 | Login - After Password Reset | Login with new password | Password recently reset | New password works | Pass |
| TC085 | Login - Haptic Feedback | Haptic on successful login | Correct credentials | Brief vibration | Pass |

### 1.6 Forgot Password (TC086-TC090)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC086 | Forgot Password - Link | Tap "Forgot Password" link | On login screen | Navigate to forgot password | Pass |
| TC087 | Forgot Password - OTP Request | Request OTP for password reset | Phone entered | OTP sent for reset | Pass |
| TC088 | Forgot Password - Verify OTP | Enter correct reset OTP | OTP received | OTP verified, password screen | Pass |
| TC089 | Forgot Password - New Password | Set new password after reset | OTP verified | New password saved | Pass |
| TC090 | Forgot Password - Login After | Login with reset password | Password reset complete | Login successful | Pass |

---

## Section 2: Profile & Settings (TC091-TC150)

### 2.1 Profile Management (TC091-TC110)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC091 | Profile View | View user profile page | Logged in | Profile displayed with all info | Pass |
| TC092 | Profile - Display Name Edit | Change display name | On profile page | Name updated successfully | Pass |
| TC093 | Profile - Name Empty | Clear display name | Name field empty | Error: "Name required" | Pass |
| TC094 | Profile - Name Max Length | Enter 100+ character name | On profile page | Truncated to max length | Pass |
| TC095 | Profile - Phone Display | Phone number shown | On profile page | Phone displayed (masked) | Pass |
| TC096 | Profile - Change Phone | Initiate phone change | On profile page | Password verification required | Pass |
| TC097 | Profile - Phone Change OTP | Verify new phone with OTP | Password verified | OTP sent to new phone | Pass |
| TC098 | Profile - Phone Change Success | Complete phone change | OTP verified | Phone updated, connections notified | Pass |
| TC099 | Profile - Change Password | Change current password | On profile page | Current password required | Pass |
| TC100 | Profile - Password Changed | Set new password | Current verified | New password saved | Pass |
| TC101 | Profile - Avatar Upload | Upload profile picture | On profile page | Image picker opened | Pass |
| TC102 | Profile - Avatar Camera | Take photo for avatar | Camera permission granted | Photo captured and set | Pass |
| TC103 | Profile - Avatar Gallery | Select from gallery | Gallery permission granted | Image selected and cropped | Pass |
| TC104 | Profile - Avatar Remove | Remove profile picture | Avatar set | Default avatar shown | Pass |
| TC105 | Profile - Mode Display | Show current app mode | On profile page | "Home Mode" or "Staff Mode" shown | Pass |
| TC106 | Profile - Switch Mode | Switch to Staff Mode | In Home Mode | Mode switched successfully | Pass |
| TC107 | Profile - Data Separate | Verify mode data separation | Switched modes | Different data per mode | Pass |
| TC108 | Profile - Delete Account | Request account deletion | On profile page | Confirmation dialog shown | Pass |
| TC109 | Profile - Delete Confirm | Confirm account deletion | Delete dialog open | Account and data deleted | Pass |
| TC110 | Profile - Logout | Tap logout button | On profile page | Logged out, login screen | Pass |

### 2.2 App Settings (TC111-TC130)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC111 | Settings - Navigate | Open settings page | Logged in | Settings page displayed | Pass |
| TC112 | Settings - Language Select | Open language picker | On settings page | 21 languages listed | Pass |
| TC113 | Settings - Change Language Hindi | Select Hindi language | Language picker open | App UI in Hindi | Pass |
| TC114 | Settings - Change Language Spanish | Select Spanish language | Language picker open | App UI in Spanish | Pass |
| TC115 | Settings - Language Persist | Verify language saved | App restarted | Language preference retained | Pass |
| TC116 | Settings - Currency Select | Open currency picker | On settings page | 120+ currencies listed | Pass |
| TC117 | Settings - Change Currency USD | Select USD currency | Currency picker open | Amounts in $ format | Pass |
| TC118 | Settings - Change Currency EUR | Select EUR currency | Currency picker open | Amounts in Euro format | Pass |
| TC119 | Settings - Currency Persist | Verify currency saved | App restarted | Currency preference retained | Pass |
| TC120 | Settings - Theme Toggle | Toggle dark/light mode | On settings page | Theme changed immediately | Pass |
| TC121 | Settings - Theme Dark | Switch to dark mode | Light mode active | Dark theme applied | Pass |
| TC122 | Settings - Theme Light | Switch to light mode | Dark mode active | Light theme applied | Pass |
| TC123 | Settings - Theme Persist | Verify theme saved | App restarted | Theme preference retained | Pass |
| TC124 | Settings - Notifications On | Enable notifications | On settings page | Notifications enabled | Pass |
| TC125 | Settings - Notifications Off | Disable notifications | Notifications on | Notifications disabled | Pass |
| TC126 | Settings - Sound On | Enable app sounds | On settings page | Sounds enabled | Pass |
| TC127 | Settings - Sound Off | Disable app sounds | Sounds on | Sounds muted | Pass |
| TC128 | Settings - Haptic On | Enable haptic feedback | On settings page | Haptics enabled | Pass |
| TC129 | Settings - Haptic Off | Disable haptic feedback | Haptics on | Haptics disabled | Pass |
| TC130 | Settings - Version Display | View app version | On settings page | Version number shown | Pass |

### 2.3 Security Settings (TC131-TC150)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC131 | Security - PIN Enable | Enable PIN lock | On security settings | PIN setup screen shown | Pass |
| TC132 | Security - PIN Set | Set 4-digit PIN | PIN setup active | PIN saved successfully | Pass |
| TC133 | Security - PIN Change | Change existing PIN | PIN enabled | Current PIN required first | Pass |
| TC134 | Security - PIN Disable | Disable PIN lock | PIN enabled | PIN removed after verify | Pass |
| TC135 | Security - PIN Lockout | Wrong PIN 5 times | PIN enabled | 30-minute lockout | Pass |
| TC136 | Security - Biometric Enable | Enable biometric lock | Device has biometric | Biometric registered | Pass |
| TC137 | Security - Biometric Disable | Disable biometric | Biometric enabled | Biometric removed | Pass |
| TC138 | Security - Auto-Lock Timing | Set auto-lock delay | On security settings | Lock after selected time | Pass |
| TC139 | Security - Lock Immediate | Set immediate lock | Auto-lock options | App locks on background | Pass |
| TC140 | Security - Lock 1 Minute | Set 1-minute delay | Auto-lock options | Locks after 1 min background | Pass |
| TC141 | Security - Lock 5 Minutes | Set 5-minute delay | Auto-lock options | Locks after 5 min background | Pass |
| TC142 | Security - Session Timeout | Session expires | Inactive for extended period | Re-authentication required | Pass |
| TC143 | Security - View Active Sessions | View logged in devices | On security settings | Device list shown | Pass |
| TC144 | Security - Terminate Session | Log out another device | Active sessions shown | Session terminated | Pass |
| TC145 | Security - Terminate All | Log out all devices | Multiple sessions | All sessions ended | Pass |
| TC146 | Security - Password Verify | Actions require password | Sensitive action | Password prompt shown | Pass |
| TC147 | Security - 2FA Status | View 2FA status | On security settings | 2FA status displayed | Pass |
| TC148 | Security - Privacy Mode | Enable privacy mode | On security settings | Sensitive data hidden | Pass |
| TC149 | Security - Screenshot Block | Block screenshots | Privacy mode on | Screenshots prevented | Pass |
| TC150 | Security - Data Export | Export personal data | On security settings | Data export initiated | Pass |

---

## Section 3: Localization & Currency (TC151-TC190)

### 3.1 Language Support (TC151-TC171)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC151 | Language - English Default | Verify English is default | Fresh install | UI in English | Pass |
| TC152 | Language - Hindi Full UI | Switch to Hindi | Language setting | All UI elements in Hindi | Pass |
| TC153 | Language - Gujarati Full UI | Switch to Gujarati | Language setting | All UI in Gujarati | Pass |
| TC154 | Language - Kannada Full UI | Switch to Kannada | Language setting | All UI in Kannada | Pass |
| TC155 | Language - Malayalam Full UI | Switch to Malayalam | Language setting | All UI in Malayalam | Pass |
| TC156 | Language - Marathi Full UI | Switch to Marathi | Language setting | All UI in Marathi | Pass |
| TC157 | Language - Punjabi Full UI | Switch to Punjabi | Language setting | All UI in Punjabi | Pass |
| TC158 | Language - Telugu Full UI | Switch to Telugu | Language setting | All UI in Telugu | Pass |
| TC159 | Language - Tamil Full UI | Switch to Tamil | Language setting | All UI in Tamil | Pass |
| TC160 | Language - Urdu Full UI | Switch to Urdu (RTL) | Language setting | RTL layout, Urdu text | Pass |
| TC161 | Language - Bengali Full UI | Switch to Bengali | Language setting | All UI in Bengali | Pass |
| TC162 | Language - Odia Full UI | Switch to Odia | Language setting | All UI in Odia | Pass |
| TC163 | Language - Assamese Full UI | Switch to Assamese | Language setting | All UI in Assamese | Pass |
| TC164 | Language - Spanish Full UI | Switch to Spanish | Language setting | All UI in Spanish | Pass |
| TC165 | Language - French Full UI | Switch to French | Language setting | All UI in French | Pass |
| TC166 | Language - German Full UI | Switch to German | Language setting | All UI in German | Pass |
| TC167 | Language - Arabic Full UI | Switch to Arabic (RTL) | Language setting | RTL layout, Arabic text | Pass |
| TC168 | Language - Chinese Full UI | Switch to Chinese | Language setting | All UI in Chinese | Pass |
| TC169 | Language - Japanese Full UI | Switch to Japanese | Language setting | All UI in Japanese | Pass |
| TC170 | Language - Portuguese Full UI | Switch to Portuguese | Language setting | All UI in Portuguese | Pass |
| TC171 | Language - Russian Full UI | Switch to Russian | Language setting | All UI in Russian | Pass |

### 3.2 Currency Support (TC172-TC190)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC172 | Currency - INR Default | Verify INR for India | India selected | Amounts in Rs. format | Pass |
| TC173 | Currency - INR Format | Check INR number format | INR selected | Indian comma format (1,00,000) | Pass |
| TC174 | Currency - USD Format | Check USD number format | USD selected | US comma format (100,000) | Pass |
| TC175 | Currency - EUR Format | Check EUR format | EUR selected | Euro format with comma decimal | Pass |
| TC176 | Currency - GBP Format | Check GBP format | GBP selected | Pound symbol format | Pass |
| TC177 | Currency - AUD Format | Check AUD format | AUD selected | A$ symbol format | Pass |
| TC178 | Currency - CAD Format | Check CAD format | CAD selected | C$ symbol format | Pass |
| TC179 | Currency - JPY Format | Check JPY format | JPY selected | Yen symbol, no decimals | Pass |
| TC180 | Currency - CNY Format | Check CNY format | CNY selected | Yuan symbol format | Pass |
| TC181 | Currency - AED Format | Check AED format | AED selected | AED symbol format | Pass |
| TC182 | Currency - SAR Format | Check SAR format | SAR selected | SAR symbol format | Pass |
| TC183 | Currency - SGD Format | Check SGD format | SGD selected | S$ symbol format | Pass |
| TC184 | Currency - Symbol Position | Currency symbol placement | Various currencies | Symbol in correct position | Pass |
| TC185 | Currency - Decimal Places | Verify decimal handling | Currency selected | Correct decimal places | Pass |
| TC186 | Currency - Large Amounts | Format large amounts | 10,000,000 entered | Formatted correctly | Pass |
| TC187 | Currency - Small Amounts | Format small amounts | 0.01 entered | Formatted correctly | Pass |
| TC188 | Currency - Negative Amounts | Format negative amounts | Expense entered | Negative symbol correct | Pass |
| TC189 | Currency - Persist Change | Currency saved on change | Currency changed | Retained after restart | Pass |
| TC190 | Currency - All Amounts Update | All displayed amounts update | Currency changed | All screens use new format | Pass |

---

**End of Part 1 - Total: 190 Test Cases**
