# Pickle v0.0.2
---

[![Written in: Fantom](http://img.shields.io/badge/written%20in-Fantom-lightgray.svg)](https://fantom-lang.org/)
[![pod: v0.0.2](http://img.shields.io/badge/pod-v0.0.2-yellow.svg)](http://eggbox.fantomfactory.org/pods/afPickle)
[![Licence: ISC](http://img.shields.io/badge/licence-ISC-blue.svg)](https://choosealicense.com/licenses/isc/)

## Overview

A simple API that pickles Plain Old Fantom Objects to and from strings.

Pickle is a drop-in replacement for the standard Fantom serialisation framework. It fixes many bugs, adds new features, and in general, *just works!*

Pickle enhancements:

* Pretty printing is event prettier (and enabled by default).
* Pickled objects may specify pods to automatically use in `using` statements - to cut down on file size.
* Works in Java AND Javascript.


Pickle fixes the following:

* [@2758](https://fantom.org/forum/topic/2758) - It-block ctors are used if they exist.
* [@2726](https://fantom.org/forum/topic/2726) - Nested Maps are possible in JS.
* [@2669](https://fantom.org/forum/topic/2669) - Maps are ordered as after de-serialisation.
* [@2644](https://fantom.org/forum/topic/2644) - Optimised serialisation when using the `skipDefaults` option.


## <a name="Install"></a>Install

Install `Pickle` with the Fantom Pod Manager ( [FPM](http://eggbox.fantomfactory.org/pods/afFpm) ):

    C:\> fpm install afPickle

Or install `Pickle` with [fanr](https://fantom.org/doc/docFanr/Tool.html#install):

    C:\> fanr install -r http://eggbox.fantomfactory.org/fanr/ afPickle

To use in a [Fantom](https://fantom-lang.org/) project, add a dependency to `build.fan`:

    depends = ["sys 1.0", ..., "afPickle 0.0"]

## <a name="documentation"></a>Documentation

Full API & fandocs are available on the [Eggbox](http://eggbox.fantomfactory.org/pods/afPickle/) - the Fantom Pod Repository.

## Quickstart

    str := Pickle.writeObj(Gerkin())
      // -->
      // "acme::Gerkin {
      //      name="Rick"
      //  }"
    
    juicy := (Gerkin) Pickle.readObj(str)
    echo(juicy.name)  // -> Rick
    
    ...
    
    class Gerkin {
        Str name := "Rick"
    }
    

