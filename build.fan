using build::BuildPod

class Build : BuildPod {

	new make() {
		podName = "afPickle"
		summary = "My Awesome pickle project"
		version = Version("0.0.1")

		meta = [
			"pod.dis"		: "Pickle",
		]

		depends = [
			// ---- Fantom Core -----------------
			"sys        1.0.70 - 1.0",
		]

		srcDirs		= [`fan/`]
		resDirs		= [`doc/`]
		jsDirs		= [`js/`]
		javaDirs	= [`java/fan/afPickle/`]
	}
}
