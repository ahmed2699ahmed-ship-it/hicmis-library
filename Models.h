#ifndef MODELS_H
#define MODELS_H

#include <string>
#include <vector>

using namespace std;

// 1. كلاس يمثل المرجع / الكتاب
class Book {
public:
    string code;
    string title;
    string author;
    string department;
    int totalCopies;
    int availableCopies;
    string pdfUrl;

    Book() : totalCopies(1), availableCopies(1) {}
    Book(string c, string t, string a, string dep, int tot, int avail, string url)
        : code(c), title(t), author(a), department(dep), totalCopies(tot), availableCopies(avail), pdfUrl(url) {}

    // تحويل البيانات لسطر محفوظ في قاعدة البيانات
    string toRecord() const {
        return code + "|" + title + "|" + author + "|" + department + "|" + 
               to_string(totalCopies) + "|" + to_string(availableCopies) + "|" + pdfUrl;
    }

    // تحويل الكائن إلى صيغة JSON ليرجع للمتصفح
    string toJson() const {
        return "{\"code\":\"" + code + "\",\"title\":\"" + title + "\",\"author\":\"" + author + 
               "\",\"department\":\"" + department + "\",\"totalCopies\":" + to_string(totalCopies) + 
               ",\"availableCopies\":" + to_string(availableCopies) + ",\"pdfUrl\":\"" + pdfUrl + "\"}";
    }
};

// 2. كلاس يمثل الطالب
class Student {
public:
    string cardId;
    string nationalId;
    string name;
    string phone;
    string academicYear;
    string department;

    Student() {}
    Student(string c, string nid, string n, string ph, string yr, string dep)
        : cardId(c), nationalId(nid), name(n), phone(ph), academicYear(yr), department(dep) {}

    string toRecord() const {
        return cardId + "|" + nationalId + "|" + name + "|" + phone + "|" + academicYear + "|" + department;
    }

    string toJson() const {
        return "{\"cardId\":\"" + cardId + "\",\"nationalId\":\"" + nationalId + "\",\"name\":\"" + name + 
               "\",\"phone\":\"" + phone + "\",\"academicYear\":\"" + academicYear + "\",\"department\":\"" + department + "\"}";
    }
};

#endif
