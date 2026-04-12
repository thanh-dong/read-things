package expo.modules.mlkitlabel

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MlkitLabelModule : Module() {
  companion object {
    // Reference the plugin package to ensure its companion init block runs,
    // which registers the "labelImage" frame processor plugin with VisionCamera.
    private val pluginPackage = MLKitLabelPluginPackage::class
  }

  override fun definition() = ModuleDefinition {
    Name("MlkitLabel")
  }
}
