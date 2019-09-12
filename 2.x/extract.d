#!/usr/bin/env rdmd

import std.algorithm;
import std.array;
import std.exception;
import std.file;
import std.path;
import std.regex;
import std.stdio;
import std.string;

void main(string[] args)
{
	auto vers = dirEntries(".", SpanMode.shallow, false).map!baseName
		.filter!(a => a.startsWith("2."))
		.array;
	vers.sort!"a<b";

	string lastWindows, lastOSX, lastLinux;

	foreach (ver; vers)
	{
		auto html = readText(chainPath(ver, "index.html"));
		auto start = html.indexOf("Files:<br>");
		if (start == -1)
			throw new Exception("Didn't find 'Files:<br>' in " ~ ver);
		html = html[start + "Files:<br>".length .. $].strip;
		if (!html.startsWith("<ul>"))
			throw new Exception(ver ~ " doesn't contain an unordered list directly after files indicator!");
		html = html["<ul>".length .. $].strip;

		string[] files;
		while (html.startsWith("<li>"))
		{
			html = html["<li>".length .. $];
			auto end = html.indexOf("</li>");
			enforce(end >= 0);
			auto file = html[0 .. end];
			html = html[end + "</li>".length .. $].strip;

			auto href = file.indexOf(`href="`);
			enforce(href >= 0);
			file = file[href + `href="`.length .. $];
			end = file.indexOf('"');
			enforce(end >= 0);
			file = file[0 .. end];

			if (file.endsWith(".sig", ".asc"))
				continue;
			files ~= file;
		}
		enforce(html.startsWith("</ul>"), ver);

		auto windows = files.filter!(a => a.canFind("windows")).array;
		auto osx = files.filter!(a => a.canFind("osx")).array;
		auto linux = files.filter!(a => a.canFind("linux")).array;

		auto preferWindows = windows.countUntil!(a => a.endsWith(".7z"));
		auto preferOSX = osx.countUntil!(a => a.endsWith(".tar.xz"));
		auto preferLinux = linux.countUntil!(a => a.endsWith(".tar.xz"));

		string windowsFile = preferWindows >= 0 ? windows[preferWindows] : windows.length
			? windows[0] : null;
		string osxFile = preferOSX >= 0 ? osx[preferOSX] : osx.length ? osx[0] : null;
		string linuxFile = preferLinux >= 0 ? linux[preferLinux] : linux.length ? linux[0] : null;

		auto any = files.countUntil!(a => a.endsWith("/dmd." ~ ver ~ ".zip"));
		if (any != -1 && (!windowsFile.length || !osxFile.length || !linuxFile.length))
			windowsFile = osxFile = linuxFile = files[any];

		windowsFile = windowsFile.replace(ver, "$$");
		osxFile = osxFile.replace(ver, "$$");
		linuxFile = linuxFile.replace(ver, "$$");

		if (windowsFile == lastWindows && osxFile == lastOSX && linuxFile == lastLinux)
		{
			writeln("+ ", ver);
			continue;
		}

		lastWindows = windowsFile;
		lastOSX = osxFile;
		lastLinux = linuxFile;

		writeln(ver, ": ", windowsFile, "\t", osxFile, "\t", linuxFile);
	}
}
