import VisionCamera
import MLKitVision
import MLKitImageLabeling

@objc(MLKitLabelPlugin)
public class MLKitLabelPlugin: FrameProcessorPlugin {
  private static let labeler: ImageLabeler = {
    let options = ImageLabelerOptions()
    options.confidenceThreshold = NSNumber(value: 0.4)
    return ImageLabeler.imageLabeler(options: options)
  }()

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    let visionImage = VisionImage(buffer: frame.buffer)
    visionImage.orientation = frame.orientation

    guard let labels = try? MLKitLabelPlugin.labeler.results(in: visionImage) else {
      return nil
    }

    return Array(labels.prefix(5)).map { label in
      return [
        "label": label.text,
        "confidence": label.confidence
      ] as [String: Any]
    }
  }
}
