# Pickle v1.0.0
---

[![Written in: Fantom](http://img.shields.io/badge/written%20in-Fantom-lightgray.svg)](https://fantom-lang.org/)
[![pod: v1.0.0](http://img.shields.io/badge/pod-v1.0.0-yellow.svg)](http://eggbox.fantomfactory.org/pods/afPickle)
[![Licence: ISC](http://img.shields.io/badge/licence-ISC-blue.svg)](https://choosealicense.com/licenses/isc/)

## Overview

A simple API that pickles Plain Old Fantom Objects to and from strings.

Pickle is a drop-in replacement for the standard [Fantom serialisation framework](https://fantom.org/doc/docLang/Serialization.html). It fixes many bugs, adds new features, and in general, *just works!*

Pickle only enhancements:

* Pretty printing is event prettier (and enabled by default).
* Object creation may be handed off to a dedicated func via new `makeObjFn` option.
* Pickled objects may omit `null` values via new `skipNulls` option.
* Pickled objects may emit `using` statements via new `usings` option, to reduce verbosity and cut down file size.
* Fully tested in Java AND Javascript.


Pickle fixes the following:

* [@2758](https://fantom.org/forum/topic/2758) - It-block ctors are used if they exist.
* [@2726](https://fantom.org/forum/topic/2726) - Nested Maps are possible in JS.
* [@2669](https://fantom.org/forum/topic/2669) - Maps are ordered as after de-serialisation.
* [@2644](https://fantom.org/forum/topic/2644) - Optimised serialisation when using the `skipDefaults` option.


The Pickle source code mostly **IS** the standard *Fantom serialisation framework*! The framework has been liberated into its own library to guard against it being [deleted from the Fantom code base](https://fantom.org/forum/topic/2758#c3) and to make much needed updates and adjustments.

Pickle contains native implementations for both Java and Javascript.

## <a name="Install"></a>Install

Install `Pickle` with the Fantom Pod Manager ( [FPM](http://eggbox.fantomfactory.org/pods/afFpm) ):

    C:\> fpm install afPickle

Or install `Pickle` with [fanr](https://fantom.org/doc/docFanr/Tool.html#install):

    C:\> fanr install -r http://eggbox.fantomfactory.org/fanr/ afPickle

To use in a [Fantom](https://fantom-lang.org/) project, add a dependency to `build.fan`:

    depends = ["sys 1.0", ..., "afPickle 1.0"]

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
    

## Usage

Pickle is a drop-in replacement for the standard [Fantom serialisation framework](https://fantom.org/doc/docLang/Serialization.html). Pickle is essentially one class with a `read` method and a `write` method for pickling your objects. Both methods may take an options Map to alter their behaviour.

### Read Options

#### makeArgs

A List of arguments that passed to the root object's make constructor via `Type.make`. These arguments may be passed *in addition* to a trailing it-block arg.

    Pickle.readObj(str, [
        "makeArgs" : Str["green"]
    ])
    
    ...
    
    class Gerkin {
        Str name
        Str colour
    
        new make(Str colour, |This| f) {
            f(this)
            this.colour = colour
        }
    }
    

Default is `null`.

#### makeObjFn

All object creation may be delegated to a dedicated function.

    Pickle.readObj(str, [
        "makeObjFn" : |Type type, Field:Obj? fieldVals->Obj?| {
            // BeanBuilder auto selects an appropiate ctor regardless of name
            afBeanUtils::BeanBuilder.build(type, vals)
        }
    ])
    

Default is `null`.

### Write Options

#### indent

May be an `Int` or a `Str`. `Int` specifies the number of spaces to indent each level while a `Str` specifies the actual indent. This makes the follow two examples identical.

    str1 := Pickle.writeObj(obj, ["indent" : 2])
    
    str2 := Pickle.writeObj(obj, ["indent" : "  "])
    

Indenting / pretty printing is on by default, becasue you're creating a *human readable* document - if that's not your intent, consider using some other `b1n4ry` serialisation instead!

Default is `"\t"`.

#### skipDefaults

Specifies if we should skip fields at their default values.  Field values are compared according to the `equals` method.

Pickling with `skipDefaults` requires a little more overhead as a default value of each type instance needs to be created for comparison. Consider using `skipNulls` instead.

Default is `false`.

#### skipErrors

Specifies if we should skip objects which aren't serializable. If `true` then `null` is output with an accompanying comment.

Default is `false`.

#### skipNulls

Specifies if we should skip fields with `null` values. `null` is a common default value and rarely adds value to a serialised document.

Default is `false`.

#### usings

List of pod names that are emitted in `using` statements at the top of the serialised document. Types from said pods are then emitted with their basic names, not their qualified names.

This often makes the serialised documents smaller, less verbose, and easier to read.

    Pickle.writeObj(Str:Int[:])
      // --> [sys::Str:sys::Int][:]
    
    Pickle.writeObj(Str:Int[:], ["usings":["sys"]])
      // --> using sys
      //     [Str:Int][:]
    

Default is `Str[,]`.

