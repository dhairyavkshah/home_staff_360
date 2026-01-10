package com.theteam360.homestaff360;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.ForegroundInfo;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;

public class BackupWorker extends Worker {
    private static final String TAG = "BackupWorker";
    private static final String CHANNEL_ID = "backup_channel";
    private static final String CHANNEL_NAME = "Backup Service";
    private static final int NOTIFICATION_ID = 1001;
    private static final int COMPLETION_NOTIFICATION_ID = 1002;

    public BackupWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(TAG, "BackupWorker started");
        
        try {
            setForegroundAsync(createForegroundInfo());
            
            SharedPreferences prefs = getApplicationContext().getSharedPreferences(
                "CapacitorStorage", Context.MODE_PRIVATE);
            String backupData = prefs.getString("backup_data", null);
            
            if (backupData == null || backupData.isEmpty()) {
                Log.w(TAG, "No backup data found in SharedPreferences");
                showCompletionNotification(false, "No data to backup");
                return Result.failure();
            }
            
            File backupDir = new File(getApplicationContext().getExternalFilesDir(null), "HomeStaff360Backups");
            
            if (!backupDir.exists()) {
                boolean created = backupDir.mkdirs();
                if (!created) {
                    Log.e(TAG, "Failed to create backup directory");
                    showCompletionNotification(false, "Failed to create backup folder");
                    return Result.failure();
                }
            }
            
            File backupFile = new File(backupDir, "homestaff360-auto-backup.hs360");
            
            FileOutputStream fos = new FileOutputStream(backupFile);
            OutputStreamWriter writer = new OutputStreamWriter(fos);
            writer.write(backupData);
            writer.close();
            fos.close();
            
            Log.d(TAG, "Backup completed successfully: " + backupFile.getAbsolutePath());
            showCompletionNotification(true, "Backup saved successfully");
            
            return Result.success();
            
        } catch (Exception e) {
            Log.e(TAG, "Backup failed", e);
            showCompletionNotification(false, "Backup failed: " + e.getMessage());
            return Result.failure();
        }
    }

    @NonNull
    private ForegroundInfo createForegroundInfo() {
        createNotificationChannel();
        
        NotificationCompat.Builder notification = new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
            .setContentTitle("Home Staff 360")
            .setContentText("Backing up your data...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return new ForegroundInfo(NOTIFICATION_ID, notification.build(), 
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            return new ForegroundInfo(NOTIFICATION_ID, notification.build());
        }
    }

    private void showCompletionNotification(boolean success, String message) {
        createNotificationChannel();
        
        NotificationCompat.Builder notification = new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
            .setContentTitle("Home Staff 360")
            .setContentText(success ? "Backup completed" : message)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        NotificationManager notificationManager = (NotificationManager) 
            getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            notificationManager.notify(COMPLETION_NOTIFICATION_ID, notification.build());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Notifications for backup operations");
            
            NotificationManager notificationManager = (NotificationManager) 
                getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
            
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}
