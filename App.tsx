
import React, { useState, useEffect } from 'react';
import useBattery from './hooks/useBattery';
import useWakeLock from './hooks/useWakeLock';
import { alarmSound } from './components/AlarmSound';
import SettingsPanel from './components/SettingsPanel';
import { BatteryCharging, Zap, ZapOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const { supported, loading, level, charging, chargingTime } = useBattery();
  const { isLocked, requestWakeLock, releaseWakeLock, error: wakeLockError } = useWakeLock();
  
  // App State
  const [threshold, setThreshold] = useState<number>(80);
  const [isAlarmEnabled, setAlarmEnabled] = useState<boolean>(true);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Derived state
  const batteryPercent = Math.round(level * 100);
  const isThresholdReached = batteryPercent >= threshold;

  // Initial interaction handler to allow audio context
  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // Logic: Handle Alarm State
  // We separate this effect to avoid circular dependencies and cleanup issues
  // that were causing the alarm to stop after the first beep.
  useEffect(() => {
    // Conditions for alarm:
    // 1. App must be loaded & Battery supported
    // 2. Currently charging (cable connected)
    // 3. Threshold reached
    // 4. User enabled alarm feature
    // 5. User has interacted (browser policy for audio)

    const shouldAlarm = 
      supported && 
      charging && 
      isThresholdReached && 
      isAlarmEnabled && 
      hasInteracted;

    // Sync UI state
    setIsAlarmActive(shouldAlarm);

    // Control Sound
    if (shouldAlarm) {
      alarmSound.start();
    } else {
      alarmSound.stop();
    }
    
    // NOTE: No cleanup function here returning stop() because we want the sound 
    // to persist across renders as long as 'shouldAlarm' is true.
    // The else block handles the stop condition.
  }, [supported, charging, isThresholdReached, isAlarmEnabled, hasInteracted]);

  // Safety cleanup on unmount only
  useEffect(() => {
    return () => {
      alarmSound.stop();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="text-amber-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-white mb-2">Battery API Not Supported</h1>
        <p className="text-slate-400 max-w-md">
          Your browser or device does not support the Battery Status API. This app works best on Android (Chrome) or Desktop Chrome/Edge.
        </p>
      </div>
    );
  }

  const getRingColor = () => {
    if (isAlarmActive) return 'stroke-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]';
    if (charging) return 'stroke-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
    return 'stroke-blue-500';
  };

  const circumference = 2 * Math.PI * 120; // Radius 120
  const strokeDashoffset = circumference - (level * circumference);

  return (
    <div 
      className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-6 transition-colors duration-500"
      onClick={handleInteraction}
    >
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <BatteryCharging className="text-emerald-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ChargeGuard</h1>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full border ${isLocked ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-slate-700 text-slate-500'}`}>
          {isLocked ? 'Awake' : 'Sleep Allowed'}
        </div>
      </header>

      {/* Main Display */}
      <main className="w-full max-w-md flex flex-col items-center gap-8 mb-12">
        
        {/* Battery Ring Visualization */}
        <div className="relative w-full max-w-[18rem] aspect-square flex items-center justify-center">
          {/* Background Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 288 288">
            <circle
              cx="144"
              cy="144"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-800"
            />
            {/* Progress Ring */}
            <circle
              cx="144"
              cy="144"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${getRingColor()}`}
            />
          </svg>
          
          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isAlarmActive && (
              <div className="animate-bounce mb-2">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
            )}
            
            <span className={`text-6xl font-bold font-mono tracking-tighter ${isAlarmActive ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {batteryPercent}%
            </span>
            
            <div className="mt-2 flex items-center gap-2 text-slate-400 font-medium">
                {charging ? (
                    <>
                        <Zap size={18} className="text-yellow-400 fill-yellow-400" />
                        <span>Charging</span>
                    </>
                ) : (
                    <>
                        <ZapOff size={18} />
                        <span>Discharging</span>
                    </>
                )}
            </div>
            
            {charging && chargingTime !== Infinity && chargingTime > 0 && (
                 <span className="text-xs text-slate-500 mt-1">
                    ~{Math.round(chargingTime / 60)} min remaining
                 </span>
            )}
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center space-y-2 h-16">
          {isAlarmActive ? (
            <div className="text-red-400 font-bold text-lg animate-pulse flex items-center gap-2 justify-center">
              <span>UNPLUG CHARGER NOW</span>
            </div>
          ) : charging && isThresholdReached ? (
             <div className="text-emerald-400 font-medium flex items-center gap-2 justify-center">
                 <CheckCircle2 size={20}/>
                 <span>Charge Goal Met</span>
             </div>
          ) : charging ? (
            <p className="text-emerald-400/80 text-sm">
                Alarm set for <span className="font-bold text-white">{threshold}%</span>
            </p>
          ) : (
            <p className="text-slate-500 text-sm">
              Connect charger to start monitoring
            </p>
          )}
        </div>

        {/* Settings Panel */}
        <SettingsPanel 
          threshold={threshold}
          setThreshold={setThreshold}
          isWakeLocked={isLocked}
          toggleWakeLock={() => isLocked ? releaseWakeLock() : requestWakeLock()}
          wakeLockError={wakeLockError}
          isAlarmEnabled={isAlarmEnabled}
          setAlarmEnabled={setAlarmEnabled}
        />

        {/* Instruction/Hint */}
        {!hasInteracted && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-200 text-center animate-pulse">
            <p>Tap anywhere to enable audio permissions</p>
          </div>
        )}

      </main>

      <footer className="mt-auto py-6 text-center text-slate-600 text-xs">
        <p>Keep this tab open/active for reliable monitoring.</p>
        <p className="mt-1 opacity-50">Web-based Battery Monitor</p>
        <p className="mt-4 text-slate-500">Made by Ryan Randeria with Love</p>
      </footer>
    </div>
  );
};

export default App;
