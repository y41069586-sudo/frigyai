package com.frigy.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ChottuLinkPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
