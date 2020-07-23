using build::BuildPod

class Build : BuildPod {

	new make() {
		podName = "afPickleTest"
		summary = "Testing the awesome pickle project"
		version = Version("0.0.1")

		meta = [
			"pod.dis"		: "PickleTest",
		]

		depends = [
			// ---- Fantom Core -----------------
			"sys        1.0.70 - 1.0",

			// ---- Fantom Factory --------------
			"afPickle   0.0.1 - 1.0",
		]

		srcDirs		= [`test/`]
	}
}
