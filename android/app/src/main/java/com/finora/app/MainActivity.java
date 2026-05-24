package com.finora.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the UserIdBridge plugin so web→native userId hand-off works
        registerPlugin(UserIdBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
