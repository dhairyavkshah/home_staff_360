# Home Staff 360 - Functional Test Cases (Mobile App)

## Part 5: Collaboration & Messaging (TC901-TC1050)

---

## Section 11: Connection Management (TC901-TC960)

### 11.1 Search & Discover (TC901-TC920)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC901 | Search - Navigate | Open connection search | Logged in | Search screen | Pass |
| TC902 | Search - By Phone | Search by phone number | Search screen | Matching users found | Pass |
| TC903 | Search - Partial Phone | Search partial phone | Search screen | No exact match shown | Pass |
| TC904 | Search - Not Found | Search unregistered phone | Phone not registered | "Not found" message | Pass |
| TC905 | Search - By Name | Search by display name | Search screen | Matching names | Pass |
| TC906 | Search - Case Insensitive | Search case variations | Users exist | Case-insensitive match | Pass |
| TC907 | Search - Empty Query | Search with empty input | Search screen | Error or no results | Pass |
| TC908 | Search - Min Characters | Search with 2 characters | Search screen | Requires 3+ chars | Pass |
| TC909 | Search - Results Display | View search results | Results found | User cards shown | Pass |
| TC910 | Search - User Info | View user in results | Results shown | Name, phone displayed | Pass |
| TC911 | Search - Avatar | User avatar in results | User has photo | Photo shown | Pass |
| TC912 | Search - Default Avatar | No photo in results | User no photo | Default avatar | Pass |
| TC913 | Search - Already Connected | Search connected user | Already connected | "Connected" badge | Pass |
| TC914 | Search - Pending Invite | Search pending user | Invite pending | "Pending" badge | Pass |
| TC915 | Search - Loading | Search loading state | Searching | Loading indicator | Pass |
| TC916 | Search - Error | Search error | Server issue | Error message | Pass |
| TC917 | Search - Clear | Clear search | Query entered | Results cleared | Pass |
| TC918 | Search - Recent | Recent searches | Past searches | Recent shown | Pass |
| TC919 | Search - Clear Recent | Clear recent searches | Recent exist | Recent cleared | Pass |
| TC920 | Search - Rate Limit | Excessive searches | Many searches | Rate limit message | Pass |

### 11.2 Connection Invites (TC921-TC945)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC921 | Invite - Send | Send connection invite | User found | Invite sent | Pass |
| TC922 | Invite - Message | Add invite message | Sending invite | Message included | Pass |
| TC923 | Invite - Sent Confirm | Invite sent confirmation | Invite sent | Success message | Pass |
| TC924 | Invite - Notification | Recipient notified | Invite sent | Push notification | Pass |
| TC925 | Invite - View Sent | View sent invites | Invites sent | Sent list | Pass |
| TC926 | Invite - View Received | View received invites | Invites received | Received list | Pass |
| TC927 | Invite - Pending Count | Pending invite badge | Invites pending | Count badge | Pass |
| TC928 | Invite - Accept | Accept connection invite | Received invite | Connection created | Pass |
| TC929 | Invite - Accept Notify | Sender notified on accept | Invite accepted | Notification sent | Pass |
| TC930 | Invite - Reject | Reject connection invite | Received invite | Invite rejected | Pass |
| TC931 | Invite - Reject Notify | Sender notified on reject | Invite rejected | Notification sent | Pass |
| TC932 | Invite - Cancel Sent | Cancel sent invite | Pending sent | Invite cancelled | Pass |
| TC933 | Invite - Expire | Invite expiration | Old invite | Expired status | Pass |
| TC934 | Invite - Resend | Resend expired invite | Expired invite | New invite sent | Pass |
| TC935 | Invite - Duplicate Block | Block duplicate invites | Pending exists | Error: "Already pending" | Pass |
| TC936 | Invite - Block User | Block user | Invite received | User blocked | Pass |
| TC937 | Invite - From Blocked | Invite from blocked | Blocked user | Invite hidden | Pass |
| TC938 | Invite - Auto-Connect | Auto-connection system | Phone in system | Auto-invite sent | Pass |
| TC939 | Invite - Pending Link | Pending phone link | Phone not registered | Link created | Pass |
| TC940 | Invite - Link Resolve | Link resolves on signup | User registers | Connection created | Pass |
| TC941 | Invite - Loading | Invite actions loading | Processing | Loading shown | Pass |
| TC942 | Invite - Error | Invite error | Server issue | Error message | Pass |
| TC943 | Invite - Swipe Actions | Swipe to accept/reject | Invite card | Quick actions | Pass |
| TC944 | Invite - Filter | Filter invites | Multiple invites | Filtered list | Pass |
| TC945 | Invite - Sort | Sort invites | Multiple invites | Sorted list | Pass |

### 11.3 Connection Management (TC946-TC960)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC946 | Connections - View All | View all connections | Connections exist | List shown | Pass |
| TC947 | Connections - Empty | No connections | New account | Empty state | Pass |
| TC948 | Connections - Card | Connection card info | Connections exist | Name, role shown | Pass |
| TC949 | Connections - Avatar | Connection avatar | Photo exists | Photo shown | Pass |
| TC950 | Connections - Last Active | Show last active | Connection exists | Active time | Pass |
| TC951 | Connections - Online Status | Show online status | Real-time enabled | Green dot | Pass |
| TC952 | Connections - Filter | Filter connections | Multiple | Filtered | Pass |
| TC953 | Connections - Search | Search connections | Multiple | Matching found | Pass |
| TC954 | Connections - Sort | Sort connections | Multiple | Sorted | Pass |
| TC955 | Connections - Tap Detail | Tap for detail | Connection card | Detail view | Pass |
| TC956 | Connections - Message | Quick message | Connection card | Chat opened | Pass |
| TC957 | Connections - Call | Quick call | Phone available | Dialer opened | Pass |
| TC958 | Connections - Remove | Remove connection | Connection exists | Confirmation | Pass |
| TC959 | Connections - Remove Confirm | Confirm removal | Dialog shown | Connection removed | Pass |
| TC960 | Connections - Block | Block connection | Connection exists | User blocked | Pass |

---

## Section 12: Real-Time Messaging (TC961-TC1050)

### 12.1 Chat Creation & Navigation (TC961-TC980)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC961 | Chat - Navigate | Open chat/messaging | Logged in | Chat list | Pass |
| TC962 | Chat - New | Start new chat | Connection exists | Chat form | Pass |
| TC963 | Chat - Select User | Select user for chat | Connections exist | User selected | Pass |
| TC964 | Chat - Create | Create new chat | User selected | Chat created | Pass |
| TC965 | Chat - Existing | Open existing chat | Chat exists | Chat opened | Pass |
| TC966 | Chat - List View | View all chats | Chats exist | List shown | Pass |
| TC967 | Chat - Empty | No chats | New account | Empty state | Pass |
| TC968 | Chat - Card Preview | Chat card shows preview | Messages exist | Last message shown | Pass |
| TC969 | Chat - Unread Badge | Unread message badge | Unread exists | Count shown | Pass |
| TC970 | Chat - Time Display | Message time | Messages exist | Time formatted | Pass |
| TC971 | Chat - Avatar | User avatar in list | User has photo | Photo shown | Pass |
| TC972 | Chat - Online Indicator | Online status | Real-time | Green dot | Pass |
| TC973 | Chat - Typing Indicator | User typing shown | Other typing | "Typing..." shown | Pass |
| TC974 | Chat - Search Chats | Search chats | Multiple chats | Matching found | Pass |
| TC975 | Chat - Filter Unread | Filter unread | Mixed chats | Only unread | Pass |
| TC976 | Chat - Sort Recent | Sort by recent | Multiple chats | Recent first | Pass |
| TC977 | Chat - Pin Chat | Pin chat to top | Chat exists | Pinned to top | Pass |
| TC978 | Chat - Mute Chat | Mute notifications | Chat exists | Muted | Pass |
| TC979 | Chat - Archive | Archive chat | Chat exists | Archived | Pass |
| TC980 | Chat - Delete | Delete chat | Chat exists | Confirmation | Pass |

### 12.2 Send Messages (TC981-TC1010)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC981 | Message - Type | Type message | Chat open | Text entered | Pass |
| TC982 | Message - Send | Send message | Message typed | Message sent | Pass |
| TC983 | Message - Send Button | Send button enabled | Text entered | Button active | Pass |
| TC984 | Message - Empty Disabled | Send disabled empty | No text | Button disabled | Pass |
| TC985 | Message - Long Text | Long message | 1000+ chars | Sent successfully | Pass |
| TC986 | Message - Multiline | Multiline message | Enter pressed | Line breaks preserved | Pass |
| TC987 | Message - Emoji | Send with emojis | Emoji added | Rendered correctly | Pass |
| TC988 | Message - URL | Send URL | URL in text | Link clickable | Pass |
| TC989 | Message - Phone | Send phone number | Phone in text | Phone clickable | Pass |
| TC990 | Message - Real-time | Message appears live | Message sent | Recipient sees live | Pass |
| TC991 | Message - Socket | WebSocket delivery | Message sent | Via Socket.IO | Pass |
| TC992 | Message - Notification | Push on message | Recipient not in chat | Push notification | Pass |
| TC993 | Message - Status Sent | Sent status | Message sent | Single check | Pass |
| TC994 | Message - Status Delivered | Delivered status | Message received | Double check | Pass |
| TC995 | Message - Status Read | Read status | Message read | Blue checks | Pass |
| TC996 | Message - Timestamp | Message timestamp | Message sent | Time shown | Pass |
| TC997 | Message - Today | Today's messages | Today messages | "Today" header | Pass |
| TC998 | Message - Yesterday | Yesterday messages | Yesterday messages | "Yesterday" header | Pass |
| TC999 | Message - Date Groups | Date grouping | Multiple days | Grouped by date | Pass |
| TC1000 | Message - Scroll Load | Load on scroll | Many messages | More loaded | Pass |
| TC1001 | Message - Scroll Bottom | Auto-scroll new | New message | Scrolls to bottom | Pass |
| TC1002 | Message - Failed | Send failure | Network error | Error indicator | Pass |
| TC1003 | Message - Retry | Retry failed | Failed message | Retry option | Pass |
| TC1004 | Message - Queue Offline | Queue when offline | No network | Queued | Pass |
| TC1005 | Message - Send Queued | Send queued | Network back | Sent | Pass |
| TC1006 | Message - Haptic | Haptic on send | Message sent | Brief vibration | Pass |
| TC1007 | Message - Sound | Sound on receive | New message | Notification sound | Pass |
| TC1008 | Message - Attachment | Send attachment | Attach file | File sent | Pass |
| TC1009 | Message - Image | Send image | Attach image | Image sent | Pass |
| TC1010 | Message - Voice | Send voice note | Record audio | Voice sent | Pass |

### 12.3 Edit & Delete Messages (TC1011-TC1030)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1011 | Edit - Access | Access edit option | Own message | Edit option shown | Pass |
| TC1012 | Edit - Tap Mobile | Tap to reveal actions | Mobile device | Actions revealed | Pass |
| TC1013 | Edit - Hover Desktop | Hover for actions | Desktop | Actions on hover | Pass |
| TC1014 | Edit - Long Press | Long press for menu | Mobile | Context menu | Pass |
| TC1015 | Edit - Open Editor | Open message editor | Edit selected | Edit input shown | Pass |
| TC1016 | Edit - Modify Text | Modify message text | Editor open | Text editable | Pass |
| TC1017 | Edit - Save | Save edited message | Text modified | Changes saved | Pass |
| TC1018 | Edit - Cancel | Cancel edit | Editor open | Changes discarded | Pass |
| TC1019 | Edit - Indicator | Edited indicator | Message edited | "Edited" shown | Pass |
| TC1020 | Edit - Real-time | Edit syncs live | Message edited | Recipient sees | Pass |
| TC1021 | Edit - Time Limit | Edit within 5 min | Message < 5 min | Edit allowed | Pass |
| TC1022 | Edit - Expired | Edit after 5 min | Message > 5 min | Edit disabled | Pass |
| TC1023 | Delete - Access | Access delete option | Own message | Delete option | Pass |
| TC1024 | Delete - Confirm | Delete confirmation | Delete selected | Confirmation dialog | Pass |
| TC1025 | Delete - Execute | Delete message | Confirmed | Message deleted | Pass |
| TC1026 | Delete - Indicator | Deleted indicator | Message deleted | "Deleted" shown | Pass |
| TC1027 | Delete - Real-time | Delete syncs live | Message deleted | Recipient sees | Pass |
| TC1028 | Delete - Time Limit | Delete within 5 min | Message < 5 min | Delete allowed | Pass |
| TC1029 | Delete - Expired | Delete after 5 min | Message > 5 min | Delete disabled | Pass |
| TC1030 | Delete - For Self | Delete for self only | Message old | Only local delete | Pass |

### 12.4 Chat Features (TC1031-TC1050)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC1031 | Chat - Read Receipts | Read receipt sent | Message opened | Sender sees read | Pass |
| TC1032 | Chat - Mark Unread | Mark as unread | Read message | Marked unread | Pass |
| TC1033 | Chat - Reply | Reply to message | Message exists | Reply attached | Pass |
| TC1034 | Chat - Forward | Forward message | Message exists | Forward options | Pass |
| TC1035 | Chat - Copy Text | Copy message text | Message exists | Text copied | Pass |
| TC1036 | Chat - Report | Report message | Inappropriate | Report submitted | Pass |
| TC1037 | Chat - Block | Block user from chat | Chat open | User blocked | Pass |
| TC1038 | Chat - Clear History | Clear chat history | Messages exist | History cleared | Pass |
| TC1039 | Chat - Export | Export chat | Messages exist | Chat exported | Pass |
| TC1040 | Chat - Notifications | Chat notification settings | Chat open | Settings shown | Pass |
| TC1041 | Chat - Mute Duration | Mute for duration | Mute selected | Duration options | Pass |
| TC1042 | Chat - Unmute | Unmute chat | Chat muted | Unmuted | Pass |
| TC1043 | Chat - Info | View chat info | Chat open | Info page | Pass |
| TC1044 | Chat - Media | View shared media | Media shared | Media gallery | Pass |
| TC1045 | Chat - Links | View shared links | Links shared | Links list | Pass |
| TC1046 | Chat - Documents | View shared docs | Docs shared | Documents list | Pass |
| TC1047 | Chat - Search Messages | Search in chat | Messages exist | Search results | Pass |
| TC1048 | Chat - Scroll to Result | Jump to search result | Results found | Scrolls to message | Pass |
| TC1049 | Chat - Background | Custom background | Settings | Background changed | Pass |
| TC1050 | Chat - Font Size | Adjust font size | Settings | Font changed | Pass |

---

**End of Part 5 - Test Cases: TC901-TC1050 (150 Test Cases)**
