
// The Battery Status API is not yet standardized in standard TypeScript lib
// We define the interfaces here.

export interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
    onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

export interface NavigatorWithBattery extends Navigator {
    getBattery?: () => Promise<BatteryManager>;
}

export interface WakeLockSentinel extends EventTarget {
    released: boolean;
    type: 'screen';
    release: () => Promise<void>;
    onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null;
}

export interface WakeLock {
    request: (type: 'screen') => Promise<WakeLockSentinel>;
}

export interface NavigatorWithWakeLock {
    wakeLock?: WakeLock;
}
