package expo.modules.mlkitlabel

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MlkitLabelModule : Module() {
  companion object {
    init {
      // Force class loading to trigger MLKitLabelPluginPackage companion init,
      // which registers the "labelImage" frame processor plugin with VisionCamera.
      MLKitLabelPluginPackage()
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MlkitLabel")
  }
}
