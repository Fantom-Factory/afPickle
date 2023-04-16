using build::BuildPod

class Build : BuildPod {

	new make() {
		podName = "afPickle"
		summary = "Pickles Fantom objects to and from strings"
		version = Version("1.0.5")

		meta = [
			"pod.dis"		: "Pickle",
			"repo.tags"		: "system",
			"repo.public"	: "true",
		]

		depends = [
			// ---- Fantom Core -----------------
			"sys        1.0.70 - 1.0",
			
			// ---- Test ------------------------
			"concurrent 1.0.70 - 1.0",
		]

		srcDirs		= [`fan/`, `test/`]
		resDirs		= [`doc/`]
		jsDirs		= [`js/`]
		javaDirs	= [`java/fan/afPickle/`]
	
		meta["afBuild.testPods"]	= "concurrent"
	}
}
