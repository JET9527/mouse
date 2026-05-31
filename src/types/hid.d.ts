// WebHID API TypeScript declarations
interface HIDDevice {
  opened: boolean
  vendorId: number
  productId: number
  productName: string
  serialNumber: string
  collections: HIDCollectionInfo[]
  open(): Promise<void>
  close(): Promise<void>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  receiveFeatureReport(reportId: number): Promise<DataView>
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>
  addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void
  addEventListener(type: 'close', listener: () => void): void
  removeEventListener(type: string, listener: (...args: any[]) => void): void
}

interface HIDCollectionInfo {
  usagePage: number
  usage: number
  collectionType: number
  inputReports: HIDReportInfo[]
  outputReports: HIDReportInfo[]
  featureReports: HIDReportInfo[]
}

interface HIDReportInfo {
  reportId: number
  items: HIDReportItem[]
}

interface HIDReportItem {
  usagePage: number
  usage: number
  reportSize: number
  reportCount: number
  logicalMinimum: number
  logicalMaximum: number
}

interface HIDInputReportEvent {
  device: HIDDevice
  reportId: number
  data: DataView
}

interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

interface HIDConnectionEvent {
  device: HIDDevice
}

interface HID {
  requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>
  getDevices(): Promise<HIDDevice[]>
  addEventListener(type: 'connect', listener: (event: HIDConnectionEvent) => void): void
  addEventListener(type: 'disconnect', listener: (event: HIDConnectionEvent) => void): void
  removeEventListener(type: string, listener: (...args: any[]) => void): void
}

interface Navigator {
  hid?: HID
}
