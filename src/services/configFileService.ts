import { CONFIG_VERSION } from '@/utils/constants'
import type { ConfigFile } from '@/types/config'

export interface ExportConfig {
  version: string
  deviceId: string
  deviceName: string
  createdAt: number
  updatedAt: number
  keyMapping: any
  macros: any[]
  deviceSettings: any
  lighting: any
  metadata: {
    author?: string
    description?: string
    tags?: string[]
  }
}

export class ConfigFileService {
  /**
   * Export configuration as JSON file
   */
  exportConfig(data: ExportConfig, fileName?: string): void {
    const configFile: ExportConfig = {
      ...data,
      version: CONFIG_VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const jsonString = JSON.stringify(configFile, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || `mouse-config-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Import configuration from file
   */
  async importConfig(file: File): Promise<ExportConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const config = JSON.parse(content) as ExportConfig
          this.validateConfig(config)
          resolve(config)
        } catch (error) {
          reject(new Error('配置文件格式错误'))
        }
      }

      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  /**
   * Validate config file structure
   */
  private validateConfig(config: ExportConfig): void {
    if (!config.version) {
      throw new Error('缺少版本号')
    }
    if (!config.keyMapping && !config.macros) {
      throw new Error('配置文件缺少必要字段')
    }
  }
}
