package expo.modules.petusagestats

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Reads Android's per-app foreground time (Digital Wellbeing data) so the pet
 * can react to social media usage. Requires the user to grant "Usage access"
 * in system settings; nothing is read before that permission is granted.
 */
class PetUsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PetUsageStats")

    AsyncFunction("hasUsageAccess") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      hasUsageAccess(context)
    }

    AsyncFunction("getUsage") { startTime: Double, endTime: Double ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any>>()
      queryUsage(context, startTime.toLong(), endTime.toLong())
    }

    AsyncFunction("openUsageAccessSettings") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }
  }

  private fun hasUsageAccess(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
      ?: return false

    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    }

    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun queryUsage(context: Context, startTime: Long, endTime: Long): List<Map<String, Any>> {
    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return emptyList()

    val stats = try {
      manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
    } catch (_: SecurityException) {
      // Usage access was revoked between the permission check and the query.
      return emptyList()
    } ?: return emptyList()

    val packageManager = context.packageManager

    return stats
      .groupBy { it.packageName }
      .map { (packageName, entries) ->
        val entry: Map<String, Any> = mapOf(
          "packageName" to packageName,
          "appName" to appLabel(packageManager, packageName),
          "totalTimeMs" to entries.sumOf { it.totalTimeInForeground },
          "lastTimeUsed" to entries.maxOf { it.lastTimeUsed }
        )
        entry
      }
      .filter { (it["totalTimeMs"] as Long) > 0L }
      .sortedByDescending { it["totalTimeMs"] as Long }
  }

  private fun appLabel(packageManager: PackageManager, packageName: String): String {
    return try {
      val info = packageManager.getApplicationInfo(packageName, 0)
      packageManager.getApplicationLabel(info).toString()
    } catch (_: Exception) {
      packageName
    }
  }
}
