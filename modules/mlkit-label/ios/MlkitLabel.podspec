Pod::Spec.new do |s|
  s.name           = 'MlkitLabel'
  s.version        = '0.1.0'
  s.summary        = 'ML Kit Image Labeling frame processor plugin for VisionCamera'
  s.description    = 'An Expo local module providing ML Kit Image Labeling as a VisionCamera frame processor plugin'
  s.author         = ''
  s.homepage       = 'https://github.com/user/read-things'
  s.platforms      = { :ios => '16.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'VisionCamera'
  s.dependency 'GoogleMLKit/ImageLabeling', '~> 7.0'

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
