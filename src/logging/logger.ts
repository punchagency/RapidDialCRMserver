type LoggerType = "debug" | "log" | "error" | "warn";

class Logger {
  private static reader(
    value: any,
    type: LoggerType,
    unlimited: boolean = false
  ) {
    const mode =
      (process.env.NODE_ENV as "development" | "production") || "development";

    if (!unlimited && mode === "development") {
      console[type](...value);
    }
  }
  //
  static info(...value: any) {
    Logger.reader(value, "debug");
  }

  static success(...value: any) {
    Logger.reader(value, "log");
  }

  static error(...value: any) {
    Logger.reader(value, "error");
  }

  static warning(...value: any) {
    Logger.reader(value, "warn");
  }

  /**
   * Show a message in the console unlimited mode i.e both production and development
   * @param type - The type of logger to use
   * @param value - The value to log
   */
  static show(type: LoggerType, ...value: any) {
    console[type](...value);
  }
}

export default Logger;
