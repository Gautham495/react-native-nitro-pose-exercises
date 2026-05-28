package com.margelo.nitro.nitroposeexercises

import android.graphics.Bitmap

object FrameHelper {
    init {
        System.loadLibrary("nitroposeexercises")
    }

    @JvmStatic
    external fun hardwareBufferToBitmap(pointer: Long): Bitmap?
}