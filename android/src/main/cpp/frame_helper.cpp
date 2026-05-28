#include <jni.h>
#include <android/hardware_buffer_jni.h>

extern "C"
JNIEXPORT jobject JNICALL
Java_com_margelo_nitro_nitroposeexercises_FrameHelper_hardwareBufferToBitmap(
    JNIEnv *env,
    jclass clazz,
    jlong pointer
) {
    AHardwareBuffer *buffer = reinterpret_cast<AHardwareBuffer *>(pointer);
    if (!buffer) return nullptr;

    // Convert AHardwareBuffer* to Java HardwareBuffer
    jobject hardwareBuffer = AHardwareBuffer_toHardwareBuffer(env, buffer);
    if (!hardwareBuffer) return nullptr;

    // Call Bitmap.wrapHardwareBuffer(hardwareBuffer, null) to create a hardware-backed Bitmap
    jclass bitmapClass = env->FindClass("android/graphics/Bitmap");
    jmethodID wrapMethod = env->GetStaticMethodID(
        bitmapClass,
        "wrapHardwareBuffer",
        "(Landroid/hardware/HardwareBuffer;Landroid/graphics/ColorSpace;)Landroid/graphics/Bitmap;"
    );
    jobject hwBitmap = env->CallStaticObjectMethod(bitmapClass, wrapMethod, hardwareBuffer, nullptr);
    if (!hwBitmap) return nullptr;

    // Copy to a software ARGB_8888 Bitmap (ML Kit needs software bitmap)
    jclass configClass = env->FindClass("android/graphics/Bitmap$Config");
    jfieldID argbField = env->GetStaticFieldID(configClass, "ARGB_8888", "Landroid/graphics/Bitmap$Config;");
    jobject argbConfig = env->GetStaticObjectField(configClass, argbField);

    jmethodID copyMethod = env->GetMethodID(bitmapClass, "copy", "(Landroid/graphics/Bitmap$Config;Z)Landroid/graphics/Bitmap;");
    jobject softBitmap = env->CallObjectMethod(hwBitmap, copyMethod, argbConfig, JNI_FALSE);

    return softBitmap;
}