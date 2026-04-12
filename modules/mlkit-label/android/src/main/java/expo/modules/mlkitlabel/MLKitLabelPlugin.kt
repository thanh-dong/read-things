package expo.modules.mlkitlabel

import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

class MLKitLabelPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {
  private val labeler = ImageLabeling.getClient(
    ImageLabelerOptions.Builder().setConfidenceThreshold(0.4f).build()
  )

  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val mediaImage = frame.image ?: return null
    val input = InputImage.fromMediaImage(mediaImage, frame.imageProxy.imageInfo.rotationDegrees)
    val labels = Tasks.await(labeler.process(input))
    return labels.take(5).map { label ->
      mapOf(
        "label" to label.text,
        "confidence" to label.confidence.toDouble()
      )
    }
  }
}
