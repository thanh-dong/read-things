package expo.modules.mlkitlabel

import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class MLKitLabelPluginPackage {
  companion object {
    init {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("labelImage") { _, _ ->
        MLKitLabelPlugin()
      }
    }
  }
}
