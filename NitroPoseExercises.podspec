require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroPoseExercises"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => 16.0 }
  s.source       = { :git => "https://github.com/Gautham495/react-native-nitro-pose-exercises.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift}",
    "ios/**/*.{m,mm}",
    "cpp/**/*.{hpp,cpp}",
  ]

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'

  load 'nitrogen/generated/ios/NitroPoseExercises+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'MediaPipeTasksVision', '~> 0.10.0'
  s.dependency "VisionCamera"

  install_modules_dependencies(s)
end
