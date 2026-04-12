package expo.modules.mlkitlabel

import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class MLKitLabelPluginPackage {
  companion object {
    init {
      FrameProcessorPluginRegistry.add("labelImage") { proxy, options ->
        MLKitLabelPlugin(proxy, options)
      }
    }
  }
}
