#ifndef LIBRARY_ENGINE_H
#define LIBRARY_ENGINE_H

#include "Models.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <algorithm>

using namespace std;

class LibraryEngine {
private:
    vector<Book> books;
    vector<Student> students;
    string booksDbPath;
    string studentsDbPath;

    // دوال مساعدة لتقسيم السلاسل النصية
    vector<string> split(const string& str, char delimiter) {
        vector<string> tokens;
        string token;
        istringstream tokenStream(str);
        while (getline(tokenStream, token, delimiter)) {
            tokens.push_back(token);
        }
        return tokens;
    }

public:
    LibraryEngine(string bPath = "books_db.txt", string sPath = "students_db.txt")
        : booksDbPath(bPath), studentsDbPath(sPath) {
        loadDataFromDisk();
    }

    // تحميل البيانات الدائمة من الهارد ديسك
    void loadDataFromDisk() {
        books.clear();
        ifstream bFile(booksDbPath.c_str());
        string line;
        while (getline(bFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, '|');
            if (parts.size() >= 7) {
                books.push_back(Book(parts[0], parts[1], parts[2], parts[3], 
                                     atoi(parts[4].c_str()), atoi(parts[5].c_str()), parts[6]));
            }
        }
        bFile.close();

        // بيانات أولية في حال كان الملف جديداً
        if (books.empty()) {
            addBook(Book("AZ-44", "أساسيات تصميم البرامج", "أ.د فاروق", "نظم معلومات إدارية", 5, 4, ""));
            addBook(Book("CS-101", "هياكل البيانات والخوارزميات بـ C++", "أحمد ربيع", "علوم حاسب", 10, 8, ""));
        }

        students.clear();
        ifstream sFile(studentsDbPath.c_str());
        while (getline(sFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, '|');
            if (parts.size() >= 6) {
                students.push_back(Student(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]));
            }
        }
        sFile.close();

        if (students.empty()) {
            addStudent(Student("202410551", "30201010101010", "أحمد صالح محمد", "01102544189", "الفرقة الثالثة", "نظم معلومات"));
        }
    }

    // حفظ فوري على الهارد ديسك (Zero-Data-Loss)
    void persistBooks() {
        ofstream bFile(booksDbPath.c_str());
        for (const auto& b : books) {
            bFile << b.toRecord() << "\n";
        }
        bFile.close();
    }

    void persistStudents() {
        ofstream sFile(studentsDbPath.c_str());
        for (const auto& s : students) {
            sFile << s.toRecord() << "\n";
        }
        sFile.close();
    }

    // خوارزمية إضافة كتاب
    bool addBook(const Book& b) {
        books.push_back(b);
        persistBooks();
        return true;
    }

    // خوارزمية إضافة طالب
    bool addStudent(const Student& s) {
        students.push_back(s);
        persistStudents();
        return true;
    }

    // خوارزمية البحث عن كتاب بواسطة الكود
    Book* findBookByCode(const string& code) {
        for (auto& b : books) {
            if (b.code == code) return &b;
        }
        return nullptr;
    }

    // تحويل قائمة الكتب لـ JSON
    string getBooksJson() const {
        string json = "[";
        for (size_t i = 0; i < books.size(); ++i) {
            json += books[i].toJson();
            if (i + 1 < books.size()) json += ",";
        }
        json += "]";
        return json;
    }

    // تحويل قائمة الطلاب لـ JSON
    string getStudentsJson() const {
        string json = "[";
        for (size_t i = 0; i < students.size(); ++i) {
            json += students[i].toJson();
            if (i + 1 < students.size()) json += ",";
        }
        json += "]";
        return json;
    }

    size_t getBooksCount() const { return books.size(); }
    size_t getStudentsCount() const { return students.size(); }
};

#endif
 