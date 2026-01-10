package com.theteam360.homestaff360;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(BackupSchedulerPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge display - draw content behind system bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // Make status bar and navigation bar transparent
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
    }
}
