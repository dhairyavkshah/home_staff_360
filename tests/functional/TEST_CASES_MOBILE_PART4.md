# Home Staff 360 - Functional Test Cases (Mobile App)

## Part 4: Home Mode - Expenses, Reports & Documents (TC681-TC900)

---

## Section 8: Expense Management (TC681-TC800)

### 8.1 Record Expense (TC681-TC720)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC681 | Expense - Navigate | Open expense module | Home mode active | Expense screen | Pass |
| TC682 | Expense - New | Create new expense | Expense module | Expense form | Pass |
| TC683 | Expense - Amount | Enter amount | Expense form | Amount accepted | Pass |
| TC684 | Expense - Amount Zero | Enter zero | Expense form | Error shown | Pass |
| TC685 | Expense - Amount Large | Enter large amount | Expense form | Formatted | Pass |
| TC686 | Expense - Category | Select category | Expense form | Categories listed | Pass |
| TC687 | Expense - Groceries | Select groceries | Categories | Groceries selected | Pass |
| TC688 | Expense - Utilities | Select utilities | Categories | Utilities selected | Pass |
| TC689 | Expense - Maintenance | Select maintenance | Categories | Maintenance selected | Pass |
| TC690 | Expense - Supplies | Select supplies | Categories | Supplies selected | Pass |
| TC691 | Expense - Custom Cat | Create custom category | Categories | Custom created | Pass |
| TC692 | Expense - Date | Select date | Expense form | Date selected | Pass |
| TC693 | Expense - Today | Default to today | New expense | Today shown | Pass |
| TC694 | Expense - Past Date | Select past date | Date picker | Past allowed | Pass |
| TC695 | Expense - Future | Future date | Date picker | Blocked | Pass |
| TC696 | Expense - Description | Enter description | Expense form | Description saved | Pass |
| TC697 | Expense - Payee | Enter payee/vendor | Expense form | Payee saved | Pass |
| TC698 | Expense - Staff Link | Link to staff | Expense form | Staff linked | Pass |
| TC699 | Expense - Receipt | Attach receipt | Expense form | Image uploaded | Pass |
| TC700 | Expense - Receipt Camera | Take receipt photo | Camera option | Photo attached | Pass |
| TC701 | Expense - Receipt Gallery | Select from gallery | Gallery option | Image attached | Pass |
| TC702 | Expense - Multiple Receipts | Attach multiple | Expense form | All attached | Pass |
| TC703 | Expense - Remove Receipt | Remove receipt | Receipt attached | Receipt removed | Pass |
| TC704 | Expense - Notes | Add notes | Expense form | Notes saved | Pass |
| TC705 | Expense - Tags | Add tags | Expense form | Tags saved | Pass |
| TC706 | Expense - Recurring | Mark as recurring | Expense form | Recurring set | Pass |
| TC707 | Expense - Save | Save expense | Valid data | Expense saved | Pass |
| TC708 | Expense - Save Loading | Loading on save | Saving | Loading shown | Pass |
| TC709 | Expense - Validation | Validation errors | Invalid data | Errors shown | Pass |
| TC710 | Expense - Cancel | Cancel entry | Form has data | Discarded | Pass |
| TC711 | Expense - Edit | Edit expense | Expense exists | Edit form | Pass |
| TC712 | Expense - Edit Save | Save edit | Changes made | Updated | Pass |
| TC713 | Expense - Delete | Delete expense | Expense exists | Confirmation | Pass |
| TC714 | Expense - Delete Confirm | Confirm delete | Dialog shown | Deleted | Pass |
| TC715 | Expense - Real-time | Sync to connected | Staff linked | Staff sees | Pass |
| TC716 | Expense - Notify | Notify linked staff | Staff connected | Notification | Pass |
| TC717 | Expense - Currency | Amount in currency | Currency set | Formatted | Pass |
| TC718 | Expense - Haptic | Haptic on save | Saved | Vibration | Pass |
| TC719 | Expense - Duplicate | Duplicate expense | Expense exists | Copy created | Pass |
| TC720 | Expense - Template | Save as template | Expense created | Template saved | Pass |

### 8.2 Expense List & History (TC721-TC760)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC721 | List - View All | View all expenses | Expenses exist | List shown | Pass |
| TC722 | List - Empty | No expenses | New account | Empty state | Pass |
| TC723 | List - Card Info | Expense card details | Expenses exist | Info displayed | Pass |
| TC724 | List - Category Icon | Category icons | Various categories | Icons shown | Pass |
| TC725 | List - Amount Display | Amount formatting | Various amounts | Formatted | Pass |
| TC726 | List - Receipt Icon | Receipt indicator | Receipt attached | Icon shown | Pass |
| TC727 | List - Filter Category | Filter by category | Multiple categories | Filtered | Pass |
| TC728 | List - Filter Date | Filter by date | Date range | Filtered | Pass |
| TC729 | List - Filter Staff | Filter by staff | Staff linked | Filtered | Pass |
| TC730 | List - Search | Search expenses | Expenses exist | Matching found | Pass |
| TC731 | List - Sort Date | Sort by date | Multiple expenses | Sorted | Pass |
| TC732 | List - Sort Amount | Sort by amount | Multiple expenses | Sorted | Pass |
| TC733 | List - Sort Category | Sort by category | Multiple expenses | Sorted | Pass |
| TC734 | List - Tap Detail | Tap for detail | Expense in list | Detail opened | Pass |
| TC735 | List - Swipe Actions | Swipe actions | Expense row | Edit/delete | Pass |
| TC736 | List - Grouped | Group by day/month | Multiple expenses | Grouped | Pass |
| TC737 | List - Section Total | Section totals | Grouped view | Totals shown | Pass |
| TC738 | List - Pull Refresh | Pull to refresh | List view | Reloaded | Pass |
| TC739 | List - Pagination | Load more | Many expenses | More loaded | Pass |
| TC740 | List - Loading | Loading state | Fetching | Skeleton | Pass |
| TC741 | List - Error | Error state | Server error | Error message | Pass |
| TC742 | Detail - View | View expense detail | Expense exists | Full details | Pass |
| TC743 | Detail - Receipt View | View receipt | Receipt attached | Image displayed | Pass |
| TC744 | Detail - Receipt Zoom | Zoom receipt | Viewing receipt | Zoom enabled | Pass |
| TC745 | Detail - Download Receipt | Download receipt | Receipt attached | Downloaded | Pass |
| TC746 | Detail - Edit | Edit from detail | Viewing expense | Edit form | Pass |
| TC747 | Detail - Delete | Delete from detail | Viewing expense | Confirmation | Pass |
| TC748 | Detail - Share | Share expense | Viewing expense | Share sheet | Pass |
| TC749 | Detail - Print | Print expense | Viewing expense | Print dialog | Pass |
| TC750 | Detail - Category Edit | Change category | Edit mode | Updated | Pass |
| TC751 | Monthly Total | View monthly total | Month data | Sum shown | Pass |
| TC752 | Weekly Total | View weekly total | Week data | Sum shown | Pass |
| TC753 | Daily Total | View daily total | Day data | Sum shown | Pass |
| TC754 | Running Total | Running total | Multiple expenses | Cumulative | Pass |
| TC755 | Budget Compare | Compare to budget | Budget set | Comparison | Pass |
| TC756 | Trend View | View expense trend | Historical | Trend shown | Pass |
| TC757 | Export List | Export expense list | Data exists | Export options | Pass |
| TC758 | Export PDF | Export as PDF | Data exists | PDF downloaded | Pass |
| TC759 | Export Excel | Export as Excel | Data exists | Excel downloaded | Pass |
| TC760 | Offline View | View offline | No network | Cached shown | Pass |

### 8.3 Expense Approvals (TC761-TC780)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC761 | Approval - Receive | Receive for approval | Staff submitted | Notification | Pass |
| TC762 | Approval - List | View pending | Pending exists | List shown | Pass |
| TC763 | Approval - Detail | View expense detail | Pending expense | Details shown | Pass |
| TC764 | Approval - Approve | Approve expense | Pending | Approved | Pass |
| TC765 | Approval - Reject | Reject expense | Pending | Rejected | Pass |
| TC766 | Approval - Reason | Rejection reason | Rejecting | Reason saved | Pass |
| TC767 | Approval - Modify | Modify amount | Approving | Modified | Pass |
| TC768 | Approval - Bulk | Bulk approve | Multiple | All approved | Pass |
| TC769 | Approval - Notify | Staff notified | Action taken | Notification | Pass |
| TC770 | Approval - Badge | Pending count | Pending exists | Badge shown | Pass |
| TC771 | Approval - History | Approval history | Past approvals | History shown | Pass |
| TC772 | Approval - Filter | Filter approvals | Various status | Filtered | Pass |
| TC773 | Approval - Sort | Sort approvals | Multiple | Sorted | Pass |
| TC774 | Approval - Undo | Undo action | Just acted | Reversed | Pass |
| TC775 | Approval - Receipt | View receipt | Receipt attached | Displayed | Pass |
| TC776 | Approval - Limit | Spending limits | Limit set | Enforced | Pass |
| TC777 | Approval - Auto | Auto-approve rules | Rules set | Auto-applied | Pass |
| TC778 | Approval - Delegate | Delegate approvals | Settings | Delegated | Pass |
| TC779 | Approval - Offline | Approve offline | No network | Queued | Pass |
| TC780 | Approval - Sync | Sync actions | Network back | Synced | Pass |

### 8.4 Expense Reports (TC781-TC800)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC781 | Report - Navigate | Open expense reports | Data exists | Report screen | Pass |
| TC782 | Report - Date Range | Select range | Report screen | Range picker | Pass |
| TC783 | Report - Summary | View summary | Data exists | Stats shown | Pass |
| TC784 | Report - Total | Total expenses | Data exists | Sum shown | Pass |
| TC785 | Report - By Category | Category breakdown | Various categories | Breakdown | Pass |
| TC786 | Report - By Staff | Staff breakdown | Staff linked | Breakdown | Pass |
| TC787 | Report - Pie Chart | Category pie chart | Data exists | Pie shown | Pass |
| TC788 | Report - Bar Chart | Monthly bar chart | Data exists | Bar shown | Pass |
| TC789 | Report - Trend | Expense trend | Historical | Trend line | Pass |
| TC790 | Report - Compare | Compare periods | Multiple periods | Comparison | Pass |
| TC791 | Report - Budget | Budget vs actual | Budget set | Comparison | Pass |
| TC792 | Report - Export PDF | Export PDF | Report ready | PDF downloaded | Pass |
| TC793 | Report - Export Excel | Export Excel | Report ready | Excel downloaded | Pass |
| TC794 | Report - Share | Share report | Report ready | Share sheet | Pass |
| TC795 | Report - Print | Print report | Report ready | Print dialog | Pass |
| TC796 | Report - Email | Email report | Report ready | Composed | Pass |
| TC797 | Report - Schedule | Schedule reports | Report screen | Scheduled | Pass |
| TC798 | Report - Loading | Loading state | Generating | Loading | Pass |
| TC799 | Report - Error | Error state | Server issue | Error message | Pass |
| TC800 | Report - Empty | No data | New account | Empty state | Pass |

---

## Section 9: Reports & Analytics (TC801-TC860)

### 9.1 Dashboard Analytics (TC801-TC830)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC801 | Dashboard - View | View home dashboard | Logged in | Dashboard shown | Pass |
| TC802 | Dashboard - Summary | Overview summary | Data exists | Stats displayed | Pass |
| TC803 | Dashboard - Staff Count | Active staff count | Staff added | Count shown | Pass |
| TC804 | Dashboard - Pending | Pending tasks count | Tasks pending | Count shown | Pass |
| TC805 | Dashboard - Today | Today's summary | Today data | Summary shown | Pass |
| TC806 | Dashboard - Attendance | Today's attendance | Staff marked | Status shown | Pass |
| TC807 | Dashboard - Balance | Pending balance | Payments due | Balance shown | Pass |
| TC808 | Dashboard - Expenses | Recent expenses | Expenses exist | Listed | Pass |
| TC809 | Dashboard - Laundry | Active batches | Batches exist | Count shown | Pass |
| TC810 | Dashboard - Approvals | Pending approvals | Approvals pending | Badge count | Pass |
| TC811 | Dashboard - Messages | Unread messages | Messages exist | Count shown | Pass |
| TC812 | Dashboard - Quick Actions | Quick action buttons | Dashboard | Actions available | Pass |
| TC813 | Dashboard - Recent Activity | Activity feed | Activity exists | Feed shown | Pass |
| TC814 | Dashboard - Widgets | Dashboard widgets | Dashboard | Widgets rendered | Pass |
| TC815 | Dashboard - Customize | Customize widgets | Dashboard | Customization UI | Pass |
| TC816 | Dashboard - Reorder | Reorder widgets | Customizing | Order saved | Pass |
| TC817 | Dashboard - Add Widget | Add widget | Customizing | Widget added | Pass |
| TC818 | Dashboard - Remove Widget | Remove widget | Customizing | Widget removed | Pass |
| TC819 | Dashboard - Charts | View charts | Data exists | Charts displayed | Pass |
| TC820 | Dashboard - Spending Chart | Monthly spending | Expense data | Chart shown | Pass |
| TC821 | Dashboard - Attendance Chart | Attendance chart | Attendance data | Chart shown | Pass |
| TC822 | Dashboard - Pull Refresh | Pull to refresh | Dashboard | Data reloaded | Pass |
| TC823 | Dashboard - Loading | Loading state | Fetching | Skeleton | Pass |
| TC824 | Dashboard - Error | Error state | Server error | Error message | Pass |
| TC825 | Dashboard - Real-time | Live updates | Data changes | Auto-refresh | Pass |
| TC826 | Dashboard - Period Switch | Switch time period | Dashboard | Period changed | Pass |
| TC827 | Dashboard - This Week | View this week | Dashboard | Week data | Pass |
| TC828 | Dashboard - This Month | View this month | Dashboard | Month data | Pass |
| TC829 | Dashboard - Compare | Compare periods | Dashboard | Comparison | Pass |
| TC830 | Dashboard - Insights | AI insights | Sufficient data | Insights shown | Pass |

### 9.2 Comprehensive Reports (TC831-TC860)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC831 | Reports - Navigate | Open reports center | Home mode | Reports screen | Pass |
| TC832 | Reports - Categories | View report types | Reports screen | Types listed | Pass |
| TC833 | Reports - Attendance | Generate attendance | Data exists | Report generated | Pass |
| TC834 | Reports - Payments | Generate payments | Data exists | Report generated | Pass |
| TC835 | Reports - Expenses | Generate expenses | Data exists | Report generated | Pass |
| TC836 | Reports - Laundry | Generate laundry | Data exists | Report generated | Pass |
| TC837 | Reports - Combined | Combined report | All data | Report generated | Pass |
| TC838 | Reports - Date Range | Select date range | Report type | Range picker | Pass |
| TC839 | Reports - Staff Filter | Filter by staff | Report options | Staff selected | Pass |
| TC840 | Reports - Category Filter | Filter by category | Report options | Category selected | Pass |
| TC841 | Reports - Preview | Preview report | Options set | Preview shown | Pass |
| TC842 | Reports - Customize | Customize columns | Report options | Columns selected | Pass |
| TC843 | Reports - Sort | Sort report data | Report generated | Data sorted | Pass |
| TC844 | Reports - Summary Section | Summary stats | Report generated | Summary shown | Pass |
| TC845 | Reports - Charts | Include charts | Report options | Charts included | Pass |
| TC846 | Reports - Export PDF | Export as PDF | Report ready | PDF downloaded | Pass |
| TC847 | Reports - Export Excel | Export as Excel | Report ready | Excel downloaded | Pass |
| TC848 | Reports - Export CSV | Export as CSV | Report ready | CSV downloaded | Pass |
| TC849 | Reports - Share | Share report | Report ready | Share sheet | Pass |
| TC850 | Reports - Email | Email report | Report ready | Email composed | Pass |
| TC851 | Reports - Print | Print report | Report ready | Print dialog | Pass |
| TC852 | Reports - Save Template | Save template | Report config | Template saved | Pass |
| TC853 | Reports - Load Template | Load template | Template exists | Template applied | Pass |
| TC854 | Reports - Schedule | Schedule report | Report options | Schedule set | Pass |
| TC855 | Reports - Auto-Send | Auto-send scheduled | Schedule reached | Report sent | Pass |
| TC856 | Reports - History | Report history | Past reports | History listed | Pass |
| TC857 | Reports - Re-Generate | Regenerate past | Past report | Regenerated | Pass |
| TC858 | Reports - Loading | Loading state | Generating | Loading shown | Pass |
| TC859 | Reports - Error | Error state | Server issue | Error message | Pass |
| TC860 | Reports - Large Data | Handle large data | Lots of data | Efficient render | Pass |

---

## Section 10: Documents & Backup (TC861-TC900)

### 10.1 Document Management (TC861-TC880)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC861 | Docs - Navigate | Open documents | Home mode | Documents screen | Pass |
| TC862 | Docs - Upload | Upload document | Documents screen | Upload started | Pass |
| TC863 | Docs - Camera | Scan document | Camera option | Document scanned | Pass |
| TC864 | Docs - Gallery | Select from gallery | Gallery option | Document selected | Pass |
| TC865 | Docs - File Types | Various file types | PDF, images | All supported | Pass |
| TC866 | Docs - Naming | Name document | Uploading | Name saved | Pass |
| TC867 | Docs - Category | Categorize document | Uploading | Category assigned | Pass |
| TC868 | Docs - Tags | Tag document | Uploading | Tags saved | Pass |
| TC869 | Docs - Staff Link | Link to staff | Uploading | Staff linked | Pass |
| TC870 | Docs - Save | Save document | Valid document | Saved | Pass |
| TC871 | Docs - List View | View all documents | Documents exist | List shown | Pass |
| TC872 | Docs - Grid View | Grid view option | Documents exist | Grid shown | Pass |
| TC873 | Docs - Filter | Filter documents | Various docs | Filtered | Pass |
| TC874 | Docs - Search | Search documents | Documents exist | Matching found | Pass |
| TC875 | Docs - View | View document | Document exists | Opened | Pass |
| TC876 | Docs - Download | Download document | Document exists | Downloaded | Pass |
| TC877 | Docs - Share | Share document | Document exists | Share sheet | Pass |
| TC878 | Docs - Delete | Delete document | Document exists | Deleted | Pass |
| TC879 | Docs - Rename | Rename document | Document exists | Renamed | Pass |
| TC880 | Docs - Move | Move to folder | Folders exist | Moved | Pass |

### 10.2 Backup & Restore (TC881-TC900)

| TC ID | Test Case Name | Test Case Scenario Description | Prerequisites | Expected Outcome | Result |
|-------|----------------|-------------------------------|---------------|------------------|--------|
| TC881 | Backup - Navigate | Open backup settings | Settings | Backup screen | Pass |
| TC882 | Backup - Create | Create backup | Data exists | Backup created | Pass |
| TC883 | Backup - Progress | Backup progress | Creating backup | Progress shown | Pass |
| TC884 | Backup - Complete | Backup complete | Backup finished | Success message | Pass |
| TC885 | Backup - Download | Download backup | Backup ready | File downloaded | Pass |
| TC886 | Backup - Cloud Save | Save to cloud | Backup ready | Saved to cloud | Pass |
| TC887 | Backup - Schedule | Schedule backups | Backup settings | Schedule set | Pass |
| TC888 | Backup - Auto | Auto backup | Schedule met | Backup created | Pass |
| TC889 | Backup - History | Backup history | Past backups | History listed | Pass |
| TC890 | Backup - Delete Old | Delete old backup | Old backup exists | Deleted | Pass |
| TC891 | Restore - Navigate | Open restore | Backup screen | Restore options | Pass |
| TC892 | Restore - Select | Select backup | Backups available | Backup selected | Pass |
| TC893 | Restore - Upload | Upload backup file | Restore screen | File uploaded | Pass |
| TC894 | Restore - Preview | Preview restore | Backup selected | Preview shown | Pass |
| TC895 | Restore - Execute | Execute restore | Backup selected | Restore started | Pass |
| TC896 | Restore - Progress | Restore progress | Restoring | Progress shown | Pass |
| TC897 | Restore - Complete | Restore complete | Restore finished | Success, data available | Pass |
| TC898 | Restore - Verify | Verify restored data | Restore complete | Data intact | Pass |
| TC899 | Restore - Error | Handle restore error | Bad backup | Error message | Pass |
| TC900 | Restore - Cancel | Cancel restore | Restoring | Cancelled | Pass |

---

**End of Part 4 - Test Cases: TC681-TC900 (220 Test Cases)**
