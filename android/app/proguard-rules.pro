# Release builds use R8 shrinking and obfuscation. These rules protect only
# classes referenced by Android manifests, Capacitor registration, or
# WorkManager's persisted worker names.
-keep class com.theteam360.homestaff360.MainActivity { *; }
-keep class com.theteam360.homestaff360.BackupSchedulerPlugin { *; }
-keep class com.theteam360.homestaff360.BackupWorker { *; }
-keepnames class com.theteam360.homestaff360.BackupWorker

# Capacitor discovers plugin metadata and bridge members at runtime.
-keep class com.getcapacitor.** { *; }
-keepattributes RuntimeVisibleAnnotations,RuntimeInvisibleAnnotations
-keepattributes RuntimeVisibleParameterAnnotations,RuntimeInvisibleParameterAnnotations
-keepattributes AnnotationDefault,InnerClasses,EnclosingMethod,Exceptions,Signature

# Preserve useful release crash line information without disabling obfuscation.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
