//
//  AudioPlayerDelegate.swift
//  Chavah Messianic Radio
//
//  Created by Judah Himango on 1/19/24.
//

import Foundation

protocol AudioPlayerDelegate: AnyObject {
    func dispatchEventToWeb(eventName: String)
}
