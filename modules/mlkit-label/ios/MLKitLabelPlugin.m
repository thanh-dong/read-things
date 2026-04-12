#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import "MlkitLabel-Swift.h"

@interface MLKitLabelPlugin (FrameProcessorPluginLoader)
@end

@implementation MLKitLabelPlugin (FrameProcessorPluginLoader)
+ (void)load {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"labelImage"
    withInitializer:^FrameProcessorPlugin*(VisionCameraProxyHolder* proxy, NSDictionary* options) {
      return [[MLKitLabelPlugin alloc] initWithProxy:proxy withOptions:options];
    }];
}
@end
