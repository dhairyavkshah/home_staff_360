package com.theteam360.homestaff360;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "BackupScheduler")
public class BackupSchedulerPlugin extends Plugin {
    private static final String TAG = "BackupSchedulerPlugin";
    private static final String WORK_NAME = "homestaff360_backup";

    @PluginMethod
    public void scheduleBackup(PluginCall call) {
        String frequency = call.getString("frequency", "daily");
        String backupData = call.getString("backupData");
        
        Log.d(TAG, "Scheduling backup with frequency: " + frequency);
        
        try {
            if (backupData != null && !backupData.isEmpty()) {
                SharedPreferences prefs = getContext().getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                prefs.edit().putString("backup_data", backupData).apply();
                Log.d(TAG, "Backup data saved to SharedPreferences");
            }
            
            long intervalHours;
            
            switch (frequency.toLowerCase()) {
                case "weekly":
                    intervalHours = 24 * 7;
                    break;
                case "monthly":
                    intervalHours = 24 * 30;
                    break;
                case "daily":
                default:
                    intervalHours = 24;
                    break;
            }
            
            Constraints constraints = new Constraints.Builder()
                .setRequiresBatteryNotLow(true)
                .build();
            
            PeriodicWorkRequest backupRequest = new PeriodicWorkRequest.Builder(
                BackupWorker.class,
                intervalHours,
                TimeUnit.HOURS
            )
                .setConstraints(constraints)
                .addTag(WORK_NAME)
                .build();
            
            WorkManager.getInstance(getContext())
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.UPDATE,
                    backupRequest
                );
            
            Log.d(TAG, "Backup scheduled successfully");
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("frequency", frequency);
            result.put("intervalHours", intervalHours);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule backup", e);
            call.reject("Failed to schedule backup: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelBackup(PluginCall call) {
        Log.d(TAG, "Cancelling scheduled backup");
        
        try {
            WorkManager.getInstance(getContext())
                .cancelUniqueWork(WORK_NAME);
            
            Log.d(TAG, "Backup cancelled successfully");
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel backup", e);
            call.reject("Failed to cancel backup: " + e.getMessage());
        }
    }

    @PluginMethod
    public void performBackupNow(PluginCall call) {
        Log.d(TAG, "Performing immediate backup");
        
        try {
            String backupData = call.getString("backupData");
            
            if (backupData != null && !backupData.isEmpty()) {
                SharedPreferences prefs = getContext().getSharedPreferences(
                    "CapacitorStorage", Context.MODE_PRIVATE);
                prefs.edit().putString("backup_data", backupData).apply();
                Log.d(TAG, "Backup data saved to SharedPreferences");
            }
            
            OneTimeWorkRequest backupRequest = new OneTimeWorkRequest.Builder(BackupWorker.class)
                .addTag(WORK_NAME + "_immediate")
                .build();
            
            WorkManager.getInstance(getContext())
                .enqueueUniqueWork(
                    WORK_NAME + "_immediate",
                    ExistingWorkPolicy.REPLACE,
                    backupRequest
                );
            
            Log.d(TAG, "Immediate backup started");
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to perform backup", e);
            call.reject("Failed to perform backup: " + e.getMessage());
        }
    }
}
